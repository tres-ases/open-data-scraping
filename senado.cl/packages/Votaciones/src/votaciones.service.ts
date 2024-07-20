import {
  getLegislaturaListJsonStructuredBucketKey, getLegislaturaSesionesJsonStructuredBucketKey,
  getLegislaturaSesionVotacionesResumenJsonLinesBucketKey,
  getLegislaturaSesionVotacionesResumenJsonStructuredBucketKey, LegislaturaSimple, LegislaturasSesionesId, Sesion,
  VotacionSimple
} from "./votaciones.model";
import axios from "axios";
import {getVotacionesUrl} from "./votaciones.constants";
import * as cheerio from "cheerio";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import Commons from "@senado-cl/commons";

const s3Client = new S3Client({});

export const getLegislaturasSesionesIdSinVotacionSimple = async (): Promise<LegislaturasSesionesId[]> => {
  const list: LegislaturasSesionesId[] = [];

  const legislaturaList: LegislaturaSimple[] = JSON.parse(await Commons.Fn.getFileFromS3(getLegislaturaListJsonStructuredBucketKey()));
  for(const l of legislaturaList) {
    const sesionList: Sesion[] = JSON.parse(await Commons.Fn.getFileFromS3(getLegislaturaSesionesJsonStructuredBucketKey(l.id)));

    for(const s of sesionList) {
      const [existe1, existe2] = await Promise.all([
        Commons.Fn.existsFromS3(getLegislaturaSesionVotacionesResumenJsonStructuredBucketKey(l.id, s.id)),
        Commons.Fn.existsFromS3(getLegislaturaSesionVotacionesResumenJsonLinesBucketKey(l.id, s.id))
      ]);

      if(!existe1 || !existe2) list.push({legisId: l.id, sesionId: s.id});
    }
  }

  return list;
}

export const getSaveVotacionSimpleList = async (legisId: number, sesionId: number) => {
  const list: VotacionSimple[] = [];

  const getVotaciones = await axios.get(getVotacionesUrl(legisId, sesionId));
  const $ = cheerio.load(getVotaciones.data);

  const votacionesTr = $('div.col1 table tr');

  const trArray = votacionesTr.toArray()

  for (let i = 1; i < trArray.length; i = i + 4) {
    const tdTema = $(trArray[i]).find('td');
    const titulo = $(tdTema).find('label').text();
    const quorum = $(tdTema).find('span').text();

    const trLink = trArray[i+1];
    const tdDatosList = $(trArray[i+2]).find('td').toArray();
    const boletin = $(tdDatosList[1]).text().trim();

    list.push({
      id: parseVotaId(
        $(trLink).find('td a').attr('href') as string
      ),
      tema: tdTema.text().replace(titulo, '').replace(quorum, '').trim(),
      quorum: quorum.replace('QUORUM: ', '').trim(),
      fecha: $(tdDatosList[0]).text().trim(),
      boletin: boletin.length > 0 ? boletin : undefined,
      resultados: {
        si: +$(tdDatosList[2]).text().trim(),
        no: +$(tdDatosList[3]).text().trim(),
        abstencion: +$(tdDatosList[4]).text().trim(),
        pareo: +$(tdDatosList[5]).text().trim(),
      }
    });
  }

  await saveLegislaturaSimpleList(legisId, sesionId, list);

  return list;
}

const saveLegislaturaSimpleList = async (legisId: number, sesionId: number, votaciones: VotacionSimple[]) => {
  await Promise.all([
    s3Client.send(new PutObjectCommand({
      Bucket: Commons.Constants.S3_BUCKET_SENADO,
      Key: getLegislaturaSesionVotacionesResumenJsonStructuredBucketKey(legisId, sesionId),
      Body: JSON.stringify(votaciones)
    })),
    s3Client.send(new PutObjectCommand({
      Bucket: Commons.Constants.S3_BUCKET_SENADO,
      Key: getLegislaturaSesionVotacionesResumenJsonLinesBucketKey(legisId, sesionId),
      Body: votaciones.map(
        v => JSON.stringify(v)
      ).join('\n')
    })),
  ]);
};

function parseVotaId(texto: string): number {
  const regex = /votaid=(\d+)/; // Expresión regular para encontrar "id=" seguido de números
  const match = texto.match(regex);

  if (match) {
    return +match[1];
  } else {
    return 0;
  }
}
