import axios from "axios";
import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {SendMessageCommand, SQSClient} from "@aws-sdk/client-sqs";
import {SenadorMapRawRepo, SesionRawListRepo} from "@senado-cl/global/repo";
import {SenadoresMapRaw, VotacionDetalleRaw} from "@senado-cl/global/model";

axios.defaults.timeout = 5000;

const serviceName = 'SenadoresDetectNewSlugs';
const logger = new Logger({
  logLevel: "INFO",
  serviceName
});
const tracer = new Tracer({serviceName});
const sqsClient = tracer.captureAWSv3Client(new SQSClient({}));

interface Event {
  legId: string
}

const senadorMapRawRepo = new SenadorMapRawRepo();
const sesionRawListRepo = new SesionRawListRepo();

class DetectNewSlugs implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler({legId}: Event, _context: any) {
    logger.info('Ejecutando detectNewSlugsHandler', {legId});
    return await this.detectNewSlugs(legId);
  }

  @tracer.captureMethod()
  public async detectNewSlugs(legId: string) {
    const dLogger = logger.createChild({
      persistentKeys: {legId}
    });
    try {
      const sesiones = await sesionRawListRepo.getBy({legId});
      let senadoresExistentes: SenadoresMapRaw;
      try {
        senadoresExistentes = await senadorMapRawRepo.get() ?? {};
      } catch (error) {
        dLogger.error('Error al obtener el listado de senadores', error);
        senadoresExistentes = {};
      }

      if (senadoresExistentes === null) senadoresExistentes = {};

      if (sesiones) {
        const senadoresNuevos = new Set<string>();
        for (const sesion of sesiones) {
          if (sesion.votaciones) {
            for (const votacion of sesion.votaciones) {
              const votos: VotacionDetalleRaw[] = [];
              if (votacion.detalle.si) votos.push(...votacion.detalle.si);
              if (votacion.detalle.no) votos.push(...votacion.detalle.no);
              if (votacion.detalle.abstencion) votos.push(...votacion.detalle.abstencion);
              if (votacion.detalle.pareo) votos.push(...votacion.detalle.pareo);
              for (const {parSlug, uuid, parlId, parNombre, parApellidoPaterno, parApellidoMaterno} of votos) {
                if (senadoresExistentes[parSlug] === undefined) {
                  senadoresExistentes[parSlug] = {
                    uuid, parlId, parNombre, parApellidoPaterno, parApellidoMaterno,
                  };
                  senadoresNuevos.add(parSlug);
                }
              }
            }
          }
        }
        if (senadoresNuevos.size > 0) {
          await Promise.all(
            [...senadoresNuevos].map(slug => {
              const params = {
                QueueUrl: process.env.NEW_SEN_SLUGS_QUEUE_URL!,
                MessageBody: slug,
              };
              const command = new SendMessageCommand(params);
              return sqsClient.send(command);
            })
          );
          dLogger.info(`Cantidad de slugs nuevos detectados ${senadoresNuevos.size}`);
          dLogger.debug('Detalle slugs nuevos detectados', {slugs: senadoresNuevos});
          await senadorMapRawRepo.save(senadoresExistentes);
        } else {
          dLogger.info('No se detectaron slugs nuevos');
        }
        return senadoresNuevos;
      }
    } catch (error) {
      dLogger.error('Error al obtener listado de slugs no descargados', error);
    }
    return [] as string[];
  }
}

const instance = new DetectNewSlugs();
export const handler = instance.handler.bind(instance);
