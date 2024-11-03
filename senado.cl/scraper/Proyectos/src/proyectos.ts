import {Handler, SQSHandler} from "aws-lambda";
import {Logger} from "@aws-lambda-powertools/logger";
import {detectNewBolIds, distill, getSaveProyectoRaw} from "./proyectos.service";

const logger = new Logger();

export const getSaveRawQueueHandler: SQSHandler = async ({Records}) => {
  logger.info('Ejecutando getSaveRawQueueHandler', {Records});
  await Promise.all(
    Records.map(async (record) => getSaveProyectoRaw(record.body))
  );
}

export const distillQueueHandler: SQSHandler = async ({Records}) => {
  logger.info('Ejecutando getSaveDtlQueueHandler', {Records});
  await Promise.all(
    Records.map(async (record) => distill(record.body))
  );
}

interface DetectNewSlugsHandlerProps {
  legId: string
}

export const detectNewBolIdsHandler: Handler<DetectNewSlugsHandlerProps> = async ({legId}) => {
  logger.info('Ejecutando detectNewBolIds', {legId});
  return await detectNewBolIds(legId);
}
