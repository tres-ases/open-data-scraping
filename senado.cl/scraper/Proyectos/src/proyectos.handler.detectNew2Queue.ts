import axios from "axios";
import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {ProyectosMapRawRepo, SesionRawListRepo} from "@senado-cl/global/repo";
import {ProyectosMapRaw} from "@senado-cl/global/model";
import {SendMessageCommand, SQSClient} from "@aws-sdk/client-sqs";

axios.defaults.timeout = 5000;

const serviceName = 'SenadoresGetSaveFromQueue';
const logger = new Logger({
  logLevel: 'INFO',
  serviceName
});
const tracer = new Tracer({serviceName});
const sqsClient = tracer.captureAWSv3Client(new SQSClient({}));

const proyectosMapRawRepo = new ProyectosMapRawRepo();
const sesionRawListRepo = new SesionRawListRepo();

interface Event {
  legId: string
}

class DetectNew2Queue implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler({legId}: Event, _context: any) {
    logger.info('Ejecutando detectNewBolIds', {legId});
    return await this.detectNewBolIds(legId);
  }

  @tracer.captureMethod()
  public async detectNewBolIds(legId: string) {
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
}

const instance = new DetectNew2Queue();
export const handler = instance.handler.bind(instance);
