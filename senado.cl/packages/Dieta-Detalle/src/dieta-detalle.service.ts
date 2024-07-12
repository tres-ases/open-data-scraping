import axios from "axios";
import * as cheerio from "cheerio";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import DietaLib from "@senado-cl/commons/dieta";
import {Ano, Dieta} from "@senado-cl/commons/dieta/model";
import Commons from "@senado-cl/commons";
import {AnoMes} from "./dieta-detalle.model";

const s3Client = new S3Client({});

const saveJsonStructured = async (ano: string, mes: string, dietas: Dieta[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: Commons.Constants.S3_BUCKET_SENADO,
    Key: DietaLib.Constants.S3_BUCKET_KEY_DETALLE_JSON_STRUCTURED(ano, mes),
    Body: JSON.stringify(dietas)
  }));
}

const saveJsonLines = async (ano: string, mes: string, dietas: Dieta[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: Commons.Constants.S3_BUCKET_SENADO,
    Key: DietaLib.Constants.S3_BUCKET_KEY_DETALLE_JSON_LINES(ano, mes),
    Body: dietas.map(
      d => JSON.stringify(d)
    ).join('\n')
  }));
}

export const getSaveDietas = async (ano: string, mes: string) => {

  const result: Dieta[] = [];

  const getDieta = await axios.get(DietaLib.Constants.GET_ANO_MES_URL(ano, mes));
  const $ = cheerio.load(getDieta.data);

  $('div[class="col1"] table tr')
    .each((i, row) => {
      if (i === 0) return;
      const data = $(row)
        .find('td')
        .toArray()
        .map(td => $(td).text());

      if (data.length > 3) {
        result.push({
          nombre: data[0],
          monto: Commons.Fn.cleanNumber(data[1]),
          descuentos: Commons.Fn.cleanNumber(data[2]),
          saldo: Commons.Fn.cleanNumber(data[3]),
        });
      }
    });

  await Promise.all([
    saveJsonStructured(ano, mes, result),
    saveJsonLines(ano, mes, result)
  ]);
  return result;
}

export const mapMesAnoArrayDieta = async (ano: number, mes: number): Promise<AnoMes[]> => {
  const anoMesArray: AnoMes[] = [];

  const anos = JSON.parse(
    await Commons.Fn.getFileFromS3(
      DietaLib.Constants.S3_BUCKET_KEY_ANO_MES_JSON_STRUCTURED
    )
  ) as Ano[];

  anos.forEach(
    a => a.meses
      .filter(
        m => +a.id > ano || (+a.id === ano && +m.id >= mes)
      )
      .forEach(
        m => anoMesArray.push({ano: a.id, mes: m.id})
      )
  )

  return anoMesArray;
}
