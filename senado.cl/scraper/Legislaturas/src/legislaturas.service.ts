import axios from "axios";
import {CommonsData} from "@senado-cl/scraper-commons";
import {LegislaturaDtl, LegislaturaRaw, LegislaturaSc} from "@senado-cl/global/model";
import {LegislaturasMapper} from "@senado-cl/global/mapper";
import {Logger} from '@aws-lambda-powertools/logger';
import sha1 from 'crypto-js/sha1';
import {LegislaturasResponse} from "./legislaturas.model";
import {
  LegislaturaDtlRepo,
  LegislaturaMapDtlRepo,
  LegislaturaRawListRepo,
  LegislaturaSesionDtlRepo,
  SesionRawListRepo
} from "@senado-cl/global/repo";

const logger = new Logger();

const LEGISLATURAS_URL = `${CommonsData.SENADO_WEB_BACK_API}/legislatures`;

const legislaturaRawListRepo = new LegislaturaRawListRepo();
const sesionRawListRepo = new SesionRawListRepo();
const legislaturaMapDtlRepo = new LegislaturaMapDtlRepo();
const legislaturaDtlRepo = new LegislaturaDtlRepo();
const legislaturaSesionDtlRepo = new LegislaturaSesionDtlRepo();

axios.defaults.timeout = 5000

export const getLegislaturas = async (): Promise<LegislaturaRaw[]> => {
  const legislaturas = await axios.get<LegislaturasResponse>(LEGISLATURAS_URL, {
    params: {
      limit: 100
    }
  });
  return transform(legislaturas.data.data);
}

const transform = (legislaturas: LegislaturaSc[]): LegislaturaRaw[] => {
  return legislaturas.map<LegislaturaRaw>(l => ({
    id: l.ID_LEGISLATURA,
    numero: l.NUMERO,
    tipo: l.TIPO,
    inicio: l.INICIO,
    termino: l.TERMINO
  }));
}

export const getSaveLegislaturas = async () => {
  await legislaturaRawListRepo.save(await getLegislaturas());
}

const readRawLegislatura = async (legId: string): Promise<LegislaturaRaw> => {
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

const saveDistilledLegislatura = async (legislatura: LegislaturaDtl) => {
  await legislaturaDtlRepo.save(legislatura, {legId: legislatura.id});

  const promises = [];
  for (const ses of legislatura.sesiones) {
    promises.push(legislaturaSesionDtlRepo.save(ses, {sesId: ses.id}));
  }

  await Promise.all(promises);
};

export const distillSaveLegislatura = async (legId: string) => {
  const dLogger = logger.createChild({
    persistentKeys: {legId}
  });
  dLogger.info("Destilando legislatura");
  let [rawLeg, rawSesList] = await Promise.all([
    readRawLegislatura(legId),
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
  promises.push(saveDistilledLegislatura(legislatura));
  if(legislaturaMap) promises.push(legislaturaMapDtlRepo.save(legislaturaMap));

  return await Promise.all(promises)
};
