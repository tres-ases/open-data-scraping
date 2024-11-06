import {Logger} from "@aws-lambda-powertools/logger";
import {Handler, SQSHandler} from "aws-lambda";
import {detectNewSlugs} from "./senadores.service";

const logger = new Logger();

interface DetectNewSlugsHandlerProps {
  legId: string
}

export const detectNewSlugsHandler: Handler<DetectNewSlugsHandlerProps> = async ({legId}) => {
  logger.info('Ejecutando detectNewSlugsHandler', {legId});
  return await detectNewSlugs(legId);
}
