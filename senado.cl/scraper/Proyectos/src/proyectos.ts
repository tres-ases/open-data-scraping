import {Handler, SQSHandler} from "aws-lambda";
import {Logger} from "@aws-lambda-powertools/logger";
import {detectNewBolIds, getSaveProyecto} from "./proyectos.service";

const logger = new Logger();

export const getSaveQueueHandler: SQSHandler = async ({Records}) => {
  logger.info('Ejecutando getSaveQueueHandler', {Records});
  await Promise.all(
    Records.map(async (record) => getSaveProyecto(record.body))
  );
}

interface DetectNewSlugsHandlerProps {
  legId: string
}

export const detectNewBolIdsHandler: Handler<DetectNewSlugsHandlerProps> = async ({legId}) => {
  logger.info('Ejecutando detectNewBolIds', {legId});
  return await detectNewBolIds(legId);
}
