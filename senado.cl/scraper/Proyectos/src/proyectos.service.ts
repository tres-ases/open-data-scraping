import * as cheerio from "cheerio";
import {SendMessageCommand, SQSClient} from '@aws-sdk/client-sqs';
import {Logger} from "@aws-lambda-powertools/logger";
import {ProyectoRaw, ProyectosMapRaw} from "@senado-cl/global/model";
import {ProyectosMapRawRepo, ProyectosRawRepo, SesionRawListRepo} from "@senado-cl/global/repo";

const logger = new Logger();

const sqsClient = new SQSClient({});

const proyectosRawRepo = new ProyectosRawRepo();
const proyectosMapRawRepo = new ProyectosMapRawRepo();
const sesionRawListRepo = new SesionRawListRepo();

export const getSaveProyecto = async (bolId: string) => {
  const proyecto = await getProyecto(bolId);
  logger.info(`Proyecto boletin: ${bolId}`, {proyecto})
  if (proyecto)
    await saveProyecto(bolId, proyecto);
}

export const saveProyecto = async (bolId: string | number, proyecto: ProyectoRaw): Promise<void> => {
  await proyectosRawRepo.save(proyecto, {bolId});
}

export const getProyecto = async (bolId: string) => {
  const url = `https://tramitacion.senado.cl/wspublico/tramitacion.php?boletin=${bolId}`;
  logger.info(`Url boletin ${bolId}`, {url})
  const $ = await cheerio.fromURL(url, {
    xml: {
      lowerCaseAttributeNames: true,
      xmlMode: true,
      lowerCaseTags: true,
      recognizeSelfClosing: true,
    }
  })

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
  if (data.proyecto) {
    return data.proyecto as unknown as ProyectoRaw;
  } else {
    return undefined;
  }
}

export const detectNewBolIds = async (legId: string) => {
  try {
    const sesiones = await sesionRawListRepo.getBy({legId});
    let proyectosExistentes: ProyectosMapRaw;
    try {
      proyectosExistentes = await proyectosMapRawRepo.get() ?? {};
    } catch (error) {
      logger.error('Error al obtener el listado de senadores', error);
      proyectosExistentes = {};
    }

    if (proyectosExistentes === null) proyectosExistentes = {};

    if (sesiones) {
      const proyectosNuevos = new Set<string>();
      for (const sesion of sesiones) {
        if (sesion.votaciones) {
          for (const votacion of sesion.votaciones) {
            const {boletin, tema} = votacion;
            if (boletin) {
              const boletinLimpio =
                boletin.indexOf('-') > 0 ?
                  boletin.split('-')[0].replace(/\D/g, '') :
                  boletin;
              if (proyectosExistentes[boletinLimpio] === undefined) {
                proyectosNuevos.add(boletinLimpio);
              }
              proyectosExistentes[boletinLimpio] = {
                boletin, tema
              };
            }
          }
        }
      }
      if (proyectosNuevos.size > 0) {
        await Promise.all(
          [...proyectosNuevos].map(slug => {
            const params = {
              QueueUrl: process.env.NEW_SEN_SLUGS_QUEUE_URL!,
              MessageBody: slug,
            };
            const command = new SendMessageCommand(params);
            return sqsClient.send(command);
          })
        );
        logger.info(`Cantidad de boletines nuevos detectados ${proyectosNuevos.size}`);
        logger.debug('Detalle boletines nuevos detectados', {boletines: proyectosNuevos});
        await proyectosMapRawRepo.save(proyectosExistentes);
      } else {
        logger.info('No se detectaron boletines nuevos');
      }
      return proyectosNuevos;
    }
  } catch (error) {
    logger.error('Error al obtener listado de slugs no descargados', error);
  }
  return [] as string[];
}
