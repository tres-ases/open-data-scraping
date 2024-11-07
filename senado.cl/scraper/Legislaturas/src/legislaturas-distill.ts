import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {
  LegislaturaDtlRepo,
  LegislaturaMapDtlRepo,
  LegislaturaRawListRepo,
  LegislaturaSesionDtlRepo,
  SesionRawListRepo
} from "@senado-cl/global/repo";
import {LegislaturaDtl, LegislaturaRaw} from "@senado-cl/global/model";
import {LegislaturasMapper} from "@senado-cl/global/mapper";
import sha1 from "crypto-js/sha1";

const serviceName = 'LegislaturasDistill';
const logger = new Logger({
  logLevel: 'DEBUG',
  serviceName
});
const tracer = new Tracer({serviceName});

interface Event {
  legId: string
}

const sesionRawListRepo = new SesionRawListRepo();
const legislaturaMapDtlRepo = new LegislaturaMapDtlRepo();
const legislaturaDtlRepo = new LegislaturaDtlRepo();
const legislaturaSesionDtlRepo = new LegislaturaSesionDtlRepo();
const legislaturaRawListRepo = new LegislaturaRawListRepo();

export class Distill implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler({legId}: Event, _context: any) {
    const dLogger = logger.createChild({
      persistentKeys: {legId}
    });
    dLogger.info("Destilando legislatura");
    let [rawLeg, rawSesList] = await Promise.all([
      this.readRaw(legId),
      sesionRawListRepo.getBy({legId})
    ])
    if(rawSesList === null) rawSesList = [];

    const legislatura = LegislaturasMapper.legislaturaRaw2LegislaturaDtl(rawLeg, rawSesList);
    let legislaturaMap = await legislaturaMapDtlRepo.get();
    if(legislaturaMap === null) {
      legislaturaMap = {};
    }

    if (legislaturaMap[legislatura.id]) {
      const hashActual = sha1(JSON.stringify(legislaturaMap[legislatura.id]));
      const hashNuevo = sha1(JSON.stringify(legislatura));

      dLogger.debug("Comparando hash's", {hashActual, hashNuevo});
      if(hashNuevo === hashActual) {
        dLogger.info("No hay cambios", {hashActual, hashNuevo});
        return;
      }
    }
    legislaturaMap[legislatura.id] = legislatura;

    const promises: Promise<any>[] = [];
    promises.push(this.save(legislatura));
    if(legislaturaMap) promises.push(legislaturaMapDtlRepo.save(legislaturaMap));

    return await Promise.all(promises)
  }

  @tracer.captureMethod()
  public async readRaw(legId: string): Promise<LegislaturaRaw> {
    const dLogger = logger.createChild({
      persistentKeys: {legId}
    });
    const list = await legislaturaRawListRepo.get();
    if (list) {
      const filtered = list.filter(l => l.id === +legId);
      if(filtered.length > 0) {
        return filtered[0];
      }
    }
    dLogger.error("legislaturaRawListRepo.get - list doesn't exist");
    throw new Error(`RawLegislatura not found for legId: ${legId}`);
  };

  @tracer.captureMethod()
  public async save(legislatura: LegislaturaDtl){
    await legislaturaDtlRepo.save(legislatura, {legId: legislatura.id});

    const promises = [];
    for (const ses of legislatura.sesiones) {
      promises.push(legislaturaSesionDtlRepo.save(ses, {sesId: ses.id}));
    }

    await Promise.all(promises);
  };
}

const instance = new Distill();
export const handler = instance.handler.bind(instance);
