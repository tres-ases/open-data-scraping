import axios from "axios";
import {GetObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {CommonsData} from "@senado-cl/scraper-commons";
import {MainBucketKey} from "@senado-cl/global";
import {
  LegislaturaDtl,
  LegislaturaMapDtl,
  LegislaturaRaw,
  LegislaturasBucketKey,
  LegislaturaSc,
  LegislaturasMapper
} from "@senado-cl/global/legislaturas";
import {SesionesBucketKey, SesionRaw} from "@senado-cl/global/sesiones";
import {Logger} from '@aws-lambda-powertools/logger';
import sha1 from 'crypto-js/sha1';
import {LegislaturasResponse} from "./legislaturas.model";

const logger = new Logger();

const LEGISLATURAS_URL = `${CommonsData.SENADO_WEB_BACK_API}/legislatures`;

const s3Client = new S3Client({});

export const getLegislaturas = async (): Promise<LegislaturaRaw[]> => {
  const legislaturas = await axios.get<LegislaturasResponse>(LEGISLATURAS_URL, {
    params: {
      limit: 100
    }
  });
  return transform(legislaturas.data.data);
}

export const saveLegislaturas = async (legislaturas: LegislaturaRaw[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: MainBucketKey.S3_BUCKET,
    Key: LegislaturasBucketKey.rawJson,
    Body: JSON.stringify(legislaturas)
  }))
};

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
  await saveLegislaturas(await getLegislaturas());
}

const readRawLegislatura = async (legId: string): Promise<LegislaturaRaw> => {
  try {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: MainBucketKey.S3_BUCKET,
      Key: LegislaturasBucketKey.rawJson
    }));

    return (JSON.parse(
      await response.Body!.transformToString()
    ) as LegislaturaRaw[])
      .filter(l => l.id === +legId)[0];
  } catch (error) {
    logger.error('readRawLegislatura', error);
    throw new Error(`RawLegislatura not found for legId: ${legId} (${LegislaturasBucketKey.rawJson})`);
  }
};

const readRawSesionList = async (legId: string) => {
  try {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: MainBucketKey.S3_BUCKET,
      Key: SesionesBucketKey.rawListJson(legId)
    }));

    return JSON.parse(await response.Body!.transformToString()) as SesionRaw[];
  } catch (error) {
    logger.error('readRawSesionList', error);
    throw new Error(`RawSesionList not found for legId: ${legId} (${SesionesBucketKey.rawListJson(legId)})`);
  }
};

const readDistilledLegislaturasMap = async () => {
  try {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: MainBucketKey.S3_BUCKET,
      Key: LegislaturasBucketKey.distilledJson
    }));

    return JSON.parse(await response.Body!.transformToString()) as LegislaturaMapDtl;
  } catch (error) {
    return {} as LegislaturaMapDtl;
  }
}

const saveDistilledLegislaturaMap = async (map: LegislaturaMapDtl) => {
  const Key = LegislaturasBucketKey.distilledJson;
  logger.info(`Almacenando mapa de legislaturas en '${Key}'`);
  return await s3Client.send(new PutObjectCommand({
    Bucket: MainBucketKey.S3_BUCKET,
    Key,
    Body: JSON.stringify(map)
  }));
}

const saveDistilledLegislatura = async (legislatura: LegislaturaDtl) => {
  const Key = LegislaturasBucketKey.distilledDetailJson(legislatura.id);
  logger.info(`Almacenando legislatura en '${Key}'`);
  await s3Client.send(new PutObjectCommand({
    Bucket: MainBucketKey.S3_BUCKET,
    Key,
    Body: JSON.stringify(legislatura)
  }));

  const promises = [];
  for(const ses of legislatura.sesiones) {
    promises.push(
      s3Client.send(new PutObjectCommand({
        Bucket: MainBucketKey.S3_BUCKET,
        Key: SesionesBucketKey.dtlJson(ses.id),
        Body: JSON.stringify(ses)
      }))
    )
  }

  await Promise.all(promises);
};

export const distillSaveLegislatura = async (legId: string) => {
  logger.info(`Destilando legislatura id:${legId}`)
  const [rawLeg, rawSesList] = await Promise.all([
    readRawLegislatura(legId),
    readRawSesionList(legId)
  ])

  const legislatura = LegislaturasMapper.legislaturaRaw2LegislaturaDtl(rawLeg, rawSesList);
  const legislaturaMap = await readDistilledLegislaturasMap();

  if (legislaturaMap[legislatura.id]) {
    const hashActual = sha1(JSON.stringify(legislaturaMap[legislatura.id]));
    const hashNuevo = sha1(JSON.stringify(legislatura));

    logger.debug(`Hash valor actual legislatura : ${hashActual}`);
    logger.debug(`Hash valor nuevo legislatura  : ${hashNuevo}`);
  }
  legislaturaMap[legislatura.id] = legislatura;

  return await Promise.all([
    saveDistilledLegislatura(legislatura),
    saveDistilledLegislaturaMap(legislaturaMap)
  ])
};
