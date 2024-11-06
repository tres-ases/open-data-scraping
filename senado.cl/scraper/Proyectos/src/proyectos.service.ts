import * as cheerio from "cheerio";
import {SendMessageCommand, SQSClient} from '@aws-sdk/client-sqs';
import {Logger} from "@aws-lambda-powertools/logger";
import {ProyectoRaw, ProyectosMapDtl, ProyectosMapRaw} from "@senado-cl/global/model";
import {ProyectosMapDtlRepo, ProyectosMapRawRepo, ProyectosRawRepo, SesionRawListRepo} from "@senado-cl/global/repo";
import {proyectoRaw2ProyectoDtl} from "./proyectos.mapper";

const logger = new Logger();

const sqsClient = new SQSClient({});

const proyectosRawRepo = new ProyectosRawRepo();
const proyectosMapRawRepo = new ProyectosMapRawRepo();
const proyectosMapDtlRepo = new ProyectosMapDtlRepo();
const sesionRawListRepo = new SesionRawListRepo();

export const distill = async (bolId: string) => {
  let mapDtl: ProyectosMapDtl;
  try {
    mapDtl = await proyectosMapDtlRepo.get() ?? {};
  } catch (error) {
    logger.error('Error al obtener el listado de senadores', error);
    mapDtl = {};
  }
  const proyecto = await proyectosRawRepo.getBy({bolId});
  if (proyecto) {
    mapDtl[bolId] = proyectoRaw2ProyectoDtl(proyecto);
    await proyectosMapDtlRepo.save(mapDtl);
  } else {
    logger.error('Error al obtener el proyecto');
  }
}

export const getSaveProyectoRaw = async (bolId: string) => {
  const dLogger = logger.createChild({
    persistentKeys: {bolId}
  });
  const proyecto = await getProyectoRaw(bolId);
  dLogger.debug('getProyectoRaw', {proyecto});
  if (proyecto) {
    await saveProyectoRaw(bolId, proyecto);
    const params = {
      QueueUrl: process.env.PROYECTO_DISTILL_QUEUE_URL!,
      MessageBody: bolId,
    };
    const command = new SendMessageCommand(params);
    dLogger.debug('SQS.SendMessageCommand', {params});
    return await sqsClient.send(command);
  }
}

export const saveProyectoRaw = async (bolId: string | number, proyecto: ProyectoRaw): Promise<void> => {
  await proyectosRawRepo.save(proyecto, {bolId});
}

export const getProyectoRaw = async (proId: string) => {
  const dLogger = logger.createChild({
    persistentKeys: {proId}
  });
  const url = `https://tramitacion.senado.cl/wspublico/tramitacion.php?boletin=${proId}`;
  dLogger.info('Obteniendo información', {url})
  const $ = await cheerio.fromURL(url, {
    xml: {
      lowerCaseAttributeNames: true,
      xmlMode: true,
      lowerCaseTags: true,
      recognizeSelfClosing: true,
    }
  });

  const data = $('proyectos').extract({
    proyecto: [
      {
        selector: 'proyecto',
        value: {
          descripcion: {
            selector: 'descripcion',
            value: {
              boletin: 'boletin',
              titulo: 'titulo',
              fechaIngreso: 'fecha_ingreso',
              iniciativa: 'iniciativa',
              camaraOrigen: 'camara_origen',
              urgenciaActual: 'urgencia_actual',
              etapa: 'etapa',
              subEtapa: 'subEtapa',
              leyNumero: 'leynro',
              diarioOficial: 'diariooficial',
              estado: 'estado',
              linkMensajeMocion: 'link_mensaje_mocion'
            }
          },
          autores: [{
            selector: 'autores > autor',
            value: {
              parlamentario: 'parlamentario',
            }
          }],
          tramitaciones: [{
            selector: 'tramitacion > tramite',
            value: {
              sesion: 'sesion',
              fecha: 'fecha',
              descripcionTramite: 'descripciontramite',
              etapaDescripcion: 'etapdescripcion',
              camaraTramite: 'camaratramite',
            }
          }],
          votaciones: [{
            selector: 'votaciones > votacion',
            value: {
              sesion: 'sesion',
              fecha: 'fecha',
              tema: 'tema',
              si: 'si',
              no: 'no',
              abstencion: 'abstencion',
              pareo: 'pareo',
              quorum: 'quorum',
              tipoProyecto: 'tipoproyecto',
              etapa: 'etapa',
              detalle: [{
                selector: 'detalle_votacion voto',
                value: {
                  parlamentario: 'parlamentario',
                  seleccion: 'seleccion',
                }
              }]
            }
          }],
          urgencias: [{
            selector: 'urgencias > urgencia',
            value: {
              tipo: 'tipo',
              ingresoFecha: 'fechaingreso',
              ingresoMensaje: 'mensajeingreso',
              ingresoCamara: 'camaraingreso',
              retiroFecha: 'fecharetiro',
              retiroMensaje: 'mensajeretiro',
              retiroCamara: 'camararetiro',
            }
          }],
          informes: [{
            selector: 'informes > informe',
            value: {
              fecha: 'fechainforme',
              tramite: 'tramite',
              etapa: 'etapa',
              link: 'link_informe',
            }
          }],
          comparados: [{
            selector: 'comparados > comparado',
            value: {
              comparado: 'comparado',
              link: 'link_comparado',
            }
          }],
          oficios: [{
            selector: 'oficios > oficio',
            value: {
              fecha: 'fecha',
              tramite: 'tramite',
              etapa: 'etapa',
              tipo: 'tipo',
              camara: 'camara',
              descripcion: 'descripcion',
              link: 'link_oficio',
            }
          }],
          indicaciones: [{
            selector: 'indicaciones > indicacion',
            value: {
              fecha: 'fecha',
              tramite: 'tramite',
              etapa: 'etapa',
              link: 'link_indicacion',
            }
          }],
          materias: ['materias > materia > descripcion']
        }
      }
    ],
  });
  if (data.proyecto && data.proyecto[0]) {
    try {
      const proyecto = data.proyecto[0] as unknown as ProyectoRaw;
      dLogger.debug('Proyecto obtenido satisfactoriamente', {proyecto})
      return proyecto;
    } catch (error) {
      dLogger.error('Error al obtener proyecto', {error});
      return undefined;
    }
  } else {
    dLogger.error('No se encontró el proyecto');
    return undefined;
  }
}

export const detectNewBolIds = async (legId: string) => {
  const dLogger = logger.createChild();
  try {
    dLogger.appendKeys({legId})
    const sesiones = await sesionRawListRepo.getBy({legId});
    dLogger.debug('sesionRawListRepo.getBy', {sesiones});
    let proyectosExistentes: ProyectosMapRaw;
    try {
      proyectosExistentes = await proyectosMapRawRepo.get() ?? {};
      dLogger.debug('proyectosMapRawRepo.get', {proyectos: proyectosExistentes})
    } catch (error) {
      dLogger.error('Error al obtener el listado de senadores', error);
      proyectosExistentes = {};
    }
    dLogger.debug('Proyectos existentes', {proyectosExistentes});

    if (proyectosExistentes === null) proyectosExistentes = {};

    if (sesiones) {
      const proyectosNuevos = new Set<string>();
      for (const sesion of sesiones) {
        try {
          dLogger.appendKeys({sesId: sesion.id});
          if (sesion.votaciones) {
            for (const votacion of sesion.votaciones) {
              try {
                dLogger.appendKeys({votId: votacion.id});
                const {boletin, tema} = votacion;
                if (boletin) {
                  const proId =
                    boletin.indexOf('-') > 0 ?
                      boletin.split('-')[0].replace(/\D/g, '') :
                      boletin;
                  const exists = proyectosExistentes[proId] != undefined;
                  dLogger.debug('Info Proyecto', {proId, boletin, exists})
                  if (!exists) {
                    proyectosNuevos.add(proId);
                  }
                  proyectosExistentes[proId] = {
                    boletin, tema
                  };
                } else {
                  dLogger.debug('Votación sin boletin')
                }
              } finally {
                dLogger.removeKeys(['votId'])
              }
            }
          } else {
            dLogger.debug('Sesión sin votaciones');
          }
        } finally {
          dLogger.removeKeys(['sesId'])
        }
      }
      if (proyectosNuevos.size > 0) {
        await Promise.all(
          [...proyectosNuevos].map(bolId => {
            const params = {
              QueueUrl: process.env.NEW_SEN_SLUGS_QUEUE_URL!,
              MessageBody: bolId,
            };
            const command = new SendMessageCommand(params);
            return sqsClient.send(command);
          })
        );
        dLogger.info(`Cantidad de boletines nuevos detectados ${proyectosNuevos.size}`);
        dLogger.info('Detalle boletines nuevos detectados', {boletines: proyectosNuevos});
        await proyectosMapRawRepo.save(proyectosExistentes);
      } else {
        dLogger.info('No se detectaron boletines nuevos');
      }
      return proyectosNuevos;
    }
  } catch (error) {
    dLogger.error('Error al obtener listado de slugs no descargados', {error});
  } finally {
    dLogger.resetKeys();
  }
  return [] as string[];
}
