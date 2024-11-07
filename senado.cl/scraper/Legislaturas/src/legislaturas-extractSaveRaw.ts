import {Logger} from "@aws-lambda-powertools/logger";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {LegislaturaRawListRepo} from "@senado-cl/global/repo";
import {CommonsData} from "@senado-cl/scraper-commons";
import {LegExtract} from "./legislaturas-extract";

const serviceName = 'LegislaturasExtractSave';
const logger = new Logger({
  logLevel: 'DEBUG',
  serviceName
});
const tracer = new Tracer({serviceName});

const LEGISLATURAS_URL = `${CommonsData.SENADO_WEB_BACK_API}/legislatures`;

const legislaturaRawListRepo = new LegislaturaRawListRepo();

export class ExtractSave extends LegExtract {

  @tracer.captureLambdaHandler()
  public async handler(_event: any, _context: any) {
    logger.debug('Ejecutando ExtractSave.handler');
    await legislaturaRawListRepo.save(await this.getList());
  }
}

const instance = new ExtractSave();
export const handler = instance.handler.bind(instance);
