import axios from "axios";
import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {ProyectosMapDtlRepo, ProyectosRawRepo} from "@senado-cl/global/repo";
import {ProyectosMapDtl} from "@senado-cl/global/model";
import {SQSEvent} from "aws-lambda/trigger/sqs";
import {proyectoRaw2ProyectoDtl} from "./proyectos.mapper";

axios.defaults.timeout = 5000;

const serviceName = 'SenadoresGetSaveFromQueue';
const logger = new Logger({
  logLevel: 'INFO',
  serviceName
});
const tracer = new Tracer({serviceName});

const proyectosRawRepo = new ProyectosRawRepo();
const proyectosMapDtlRepo = new ProyectosMapDtlRepo();

class DistillFromQueue implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler({Records}: SQSEvent, _context: any) {
    logger.info('Ejecutando getSaveDtlQueueHandler', {Records});
    await Promise.all(
      Records.map(async (record) => this.distill(record.body))
    );
  }

  @tracer.captureMethod()
  public async distill(bolId: string) {
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
}

const instance = new DistillFromQueue();
export const handler = instance.handler.bind(instance);
