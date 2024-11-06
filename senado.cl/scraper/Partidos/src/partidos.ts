import {SQSHandler} from "aws-lambda";
import {Logger} from "@aws-lambda-powertools/logger";
import {distillMap} from "./partidos.service";

const logger = new Logger();

export const distillMapQueueHandler: SQSHandler = async ({Records}) => {
  logger.debug('Ejecutando distillMapQueueHandler', {Records});
  for(const {body} of Records) {
    await distillMap(body);
  }
}
