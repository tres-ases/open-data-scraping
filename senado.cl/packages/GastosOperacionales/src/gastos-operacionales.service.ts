import * as _ from "lodash";
import axios from "axios";
import * as cheerio from "cheerio";
import Commons from "@senado-cl/commons";
import {AnoMesParl} from "./gastos-operacionales.model";
import {GastosOperacionales} from "./gastos-operacionales.model";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";

const s3Client = new S3Client({});

const getJsonBucketKey =
  (ano: number, mes: number, parlId: number) => `/GastosOperacionales/JsonStructured/parlId=${parlId}/ano=${ano}/mes=${mes}/data.json`;
const getJsonLineBucketKey =
  (ano: number, mes: number, parlId: number) => `/GastosOperacionales/JsonLines/parlId=${parlId}/ano=${ano}/mes=${mes}/data.jsonl`;

const anoMesParUrl = (ano: number, mes: number, parlId?: number) => `https://www.senado.cl/appsenado/index.php?mo=transparencia&ac=informeTransparencia&tipo=20&anno=${ano}&mesid=${mes}${parlId ? `&parlid=${parlId}` : ''}`;

const saveJsonStructured = async (ano: number, mes: number, parlId: number, gastos: GastosOperacionales[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: Commons.Constants.S3_BUCKET_SENADO,
    Key: getJsonBucketKey(ano, mes, parlId),
    Body: JSON.stringify(gastos)
  }));
}

const saveJsonLines = async (ano: number, mes: number, parlId: number, gastos: GastosOperacionales[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: Commons.Constants.S3_BUCKET_SENADO,
    Key: getJsonLineBucketKey(ano, mes, parlId),
    Body: gastos.map(
      d => JSON.stringify(d)
    ).join('\n')
  }));
}

const getAnoMesArray = (ano: number, mes: number) => {
  return Commons.Fn.getAnoMesArray(ano, mes);
}

const addParlIdToAnoMesArray = async (ano: number, mes: number): Promise<AnoMesParl[]> => {
  const page = await axios.get(anoMesParUrl(ano, mes));
  const $ = cheerio.load(page.data);
  const parlOptions = $('select[name="parlamentarios"] > option');

  return parlOptions.toArray()
    .map(o =>
      ({ano, mes, parlId: +($(o).attr('value') as string)})
    )
    .filter(({parlId}) => parlId > 0);
}

export const getAnoMesParlIdArray = async (anoMin: number, mesMin: number) => {
  const anoMesParlIdArray: AnoMesParl[] = [];

  for (const {ano, mes} of getAnoMesArray(anoMin, mesMin)) {
    anoMesParlIdArray.push(...await addParlIdToAnoMesArray(ano, mes));
  }

  return anoMesParlIdArray;
};

export const getSaveData = async (ano: number, mes: number, parlId: number) => {
  const gastosOperacionales: GastosOperacionales[] = [];

  const page = await axios.get(anoMesParUrl(ano, mes, parlId));
  const $ = cheerio.load(page.data);

  $('section.seccion2 table tr')
    .each((i, row) => {
      if(i === 0) return;
      const data = $(row)
        .find(':scope > *')
        .toArray()
        .map(td => $(td).text());

      if (data.length === 2) {
        if (data[0] === 'Concepto' || data[1] === 'Monto') return;
        const concepto = cleanConcepto(data[0]);
        if (concepto.length === 0) return;
        else if (concepto.toUpperCase() === 'TOTAL GASTO' || _.startsWith(concepto.toUpperCase(), 'TOTAL ') || concepto.toUpperCase().includes('FEBRERO')) return;
        gastosOperacionales.push({
          concepto, monto: cleanMonto(data[1])
        })
      }
      else if (data.length > 2) {
        let concepto = cleanConcepto(data[0]);
        // En las tablas del 2014 hacia abajo el texto del concepto está en la segunda columna
        if(concepto.length === 0) {
          concepto = cleanConcepto(data[1]);
        }
        if (concepto.toUpperCase() === 'TOTAL GASTO' || _.startsWith(concepto.toUpperCase(), 'TOTAL ') || concepto.includes('EJECUCION TRIMESTRAL MOVIL')) return;
        if (concepto.length === 0) return;
        gastosOperacionales.push({
          concepto, monto: cleanMonto(data[data.length-1])
        })
      }
    });

  await Promise.all([
    saveJsonStructured(ano, mes, parlId, gastosOperacionales),
    saveJsonLines(ano, mes, parlId, gastosOperacionales),
  ]);
  return gastosOperacionales;
}

const cleanMonto = (valor: string): number => {
  valor = _.replace(valor, /<\/?[^>]+(>|$)/g, '');
  valor = _.replace(valor, /[$,.;]/g, '');
  const monto = +_.trim(valor);
  return isNaN(monto) || monto === null ? 0 : monto;
}

const cleanConcepto = (concepto: string): string => {
  concepto = _.replace(concepto, /<\/?[^>]+(>|$)/g, '');
  return _.trim(concepto);
}
