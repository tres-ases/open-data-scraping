import {Logger} from "@aws-lambda-powertools/logger";
import {Handler} from "aws-lambda";
import { SQSHandler } from 'aws-lambda';
import {detectNewSlugs, getSaveSenador} from "./senadores.service";

const logger = new Logger();

interface GetSaveQueueHandlerProps {
  slug: string
}

export const getSaveHandler: Handler<GetSaveQueueHandlerProps> = async ({slug}) => {
  logger.info(`Ejecutando getSaveHandler - slug=${slug}`);
  return await getSaveSenador(slug);
}

export const getSaveQueueHandler: SQSHandler = async ({Records}) => {
  logger.info(`Ejecutando getSaveQueueHandler - Records="${JSON.stringify(Records)}"`);
  await Promise.all(
    Records.map(async (record) => getSaveSenador(record.body))
  )
}

interface DetectNewSlugsHandlerProps {
  legId: string
}

export const detectNewSlugsHandler: Handler<DetectNewSlugsHandlerProps> = async ({legId}) => {
  logger.info(`Ejecutando detectNewSlugsHandler - legId=${legId}`);
  return await detectNewSlugs(legId);
}
