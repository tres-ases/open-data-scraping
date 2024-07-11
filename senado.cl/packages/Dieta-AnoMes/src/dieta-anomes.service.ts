import axios from "axios";
import * as cheerio from "cheerio";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import Dieta from "@senado-cl/commons/dieta";
import Commons from "@senado-cl/commons";
import {Ano, Mes} from "@senado-cl/commons/dieta/model";

const s3Client = new S3Client({});

export const saveJsonStructured = async (anos: Ano[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: Commons.Constants.S3_BUCKET_SENADO,
    Key: Dieta.Constants.S3_BUCKET_KEY_ANO_MES_JSON_STRUCTURED,
    Body: JSON.stringify(anos)
  }));
}

export const saveJsonLines = async (anos: Ano[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: Commons.Constants.S3_BUCKET_SENADO,
    Key: Dieta.Constants.S3_BUCKET_KEY_ANO_MES_JSON_LINES,
    Body: anos.map(
      a => Dieta.Fn.flattenAno(a)
    ).join('\n')
  }));
}

export const getAnos = async (ano?: string): Promise<Ano[]> => {
  const anos: Ano[] = [];

  const getAnos = await axios.get(Dieta.Constants.GET_ANO_URL);
  const $ = cheerio.load(getAnos.data);
  const anosOptions = $('select[name="annos"] > option');

  for (const option of anosOptions) {
    const id = $(option).attr('value');
    if (ano !== undefined && ano !== id) continue;
    if (id !== undefined && id !== "0")
      anos.push({
        id,
        description: $(option).text(),
        meses: await getMeses(id)
      });
  }

  return anos;
}

const getMeses = async (ano: string): Promise<Mes[]> => {
  const meses: Mes[] = [];

  const getMeses = await axios.get(Dieta.Constants.GET_ANO_MES_URL(ano));
  const $ = cheerio.load(getMeses.data);

  const anosOptions = $('select[name="meses"] > option');

  for (const option of anosOptions) {
    const id = $(option).attr('value');
    if (id !== undefined && id !== "0" && id !== "00")
      meses.push({
        id,
        description: $(option).text()
      });
  }

  return meses;
}
