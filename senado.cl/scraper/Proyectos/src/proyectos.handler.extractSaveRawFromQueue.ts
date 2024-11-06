import axios from "axios";
import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {ProyectosRawRepo} from "@senado-cl/global/repo";
import {SQSEvent} from "aws-lambda/trigger/sqs";
import {SendMessageCommand, SQSClient} from "@aws-sdk/client-sqs";
import {ProyectoRaw} from "@senado-cl/global/model";
import * as cheerio from "cheerio";

axios.defaults.timeout = 5000;

const serviceName = 'SenadoresGetSaveFromQueue';
const logger = new Logger({
  logLevel: 'INFO',
  serviceName
});
const tracer = new Tracer({serviceName});
const sqsClient = tracer.captureAWSv3Client(new SQSClient({}));

const proyectosRawRepo = new ProyectosRawRepo();

export class ExtractSaveRawFromQueue implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler({Records}: SQSEvent, _context: any) {
    logger.info('Ejecutando getSaveRawQueueHandler', {Records});
    await Promise.all(
      Records.map(async (record) => this.extractSaveRaw(record.body))
    );
  }

  @tracer.captureMethod()
  public async extractSaveRaw(bolId: string) {
    const dLogger = logger.createChild({
      persistentKeys: {bolId}
    });
    const proyecto = await this.extract(bolId);
    dLogger.debug('getProyectoRaw', {proyecto});
    if (proyecto) {
      await proyectosRawRepo.save(proyecto, {bolId});
      const params = {
        QueueUrl: process.env.PROYECTO_DISTILL_QUEUE_URL!,
        MessageBody: bolId,
      };
      const command = new SendMessageCommand(params);
      dLogger.debug('SQS.SendMessageCommand', {params});
      return await sqsClient.send(command);
    }
  }

  @tracer.captureMethod()
  public async extract(proId: string) {
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
}

const instance = new ExtractSaveRawFromQueue();
export const handler = instance.handler.bind(instance);
