import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {LegislaturaRawListRepo} from "@senado-cl/global/repo";
import {LegislaturaRaw, LegislaturaSc} from "@senado-cl/global/model";
import axios from "axios";
import {LegislaturasResponse} from "./legislaturas.model";
import {CommonsData} from "@senado-cl/scraper-commons";

const serviceName = 'LegislaturasExtract';
const logger = new Logger({
  logLevel: 'DEBUG',
  serviceName
});
const tracer = new Tracer({serviceName});

const LEGISLATURAS_URL = `${CommonsData.SENADO_WEB_BACK_API}/legislatures?limit=200`;

export class LegExtract implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler(_event: any, _context: any): Promise<any> {
    logger.debug('Ejecutando Extract.handler');
    return await this.getList();
  }

  @tracer.captureMethod()
  public async getList(): Promise<LegislaturaRaw[]> {
    const response = await fetch(LEGISLATURAS_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    const json: LegislaturasResponse = await response.json();
    return this.transform(json.data);
  }

  @tracer.captureMethod()
  public transform(legislaturas: LegislaturaSc[]): LegislaturaRaw[] {
    return legislaturas.map<LegislaturaRaw>(l => ({
      id: l.ID_LEGISLATURA,
      numero: l.NUMERO,
      tipo: l.TIPO,
      inicio: l.INICIO,
      termino: l.TERMINO
    }));
  }
}

const instance = new LegExtract();
export const handler = instance.handler.bind(instance);
