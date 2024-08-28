import * as _ from "lodash";
import axios from "axios";
import * as cheerio from "cheerio";
import Commons from "@senado-cl/commons";
import {MainBucketKey} from "@senado-cl/global";
import {AnoMesParl, GastosOperacionales, GastosOperacionalesBucketKey} from "@senado-cl/global/gastos-operacionales";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {AnoMes} from "@senado-cl/global/dieta";

const s3Client = new S3Client({});

const anoMesParUrl = (ano: number, mes: number, parlId?: number) => `https://www.senado.cl/appsenado/index.php?mo=transparencia&ac=informeTransparencia&tipo=20&anno=${ano}&mesid=${mes}${parlId ? `&parlid=${parlId}` : ''}`;

const saveJsonStructured = async (ano: number, mes: number, parlId: number, gastos: GastosOperacionales[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: MainBucketKey.S3_BUCKET,
    Key: GastosOperacionalesBucketKey.parlIdAnoMesJsonStructured(parlId, ano, mes),
    Body: JSON.stringify(gastos)
  }));
}

const saveJsonLines = async (ano: number, mes: number, parlId: number, gastos: GastosOperacionales[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: MainBucketKey.S3_BUCKET,
    Key: GastosOperacionalesBucketKey.parlIdAnoMesJsonLines(parlId, ano, mes),
    Body: gastos.map(
      d => JSON.stringify(d)
    ).join('\n')
  }));
}

export const getAnoMesArray = (ano?: number) => {
  return Commons.Fn.getAnoMesArray(ano);
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

export const getAnoMesParlIdArray = async (anoMesArray: AnoMes[]) => {
  const anoMesParlIdArray: AnoMesParl[] = [];

  for (const {ano, mes} of anoMesArray) {
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
