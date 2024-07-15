import axios from "axios";
import * as cheerio from "cheerio";
import {Periodo, PeriodoSenador, PeriodoTipo} from "./senadores.model";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import Commons from "@senado-cl/commons";

const s3Client = new S3Client({});

export enum Tipo {
  ACTUALES = 1,
  ANTERIORES = 2
}

const getSenadoresPeriodoUrl = (tipo: Tipo) => `https://tramitacion.senado.cl/appsenado/index.php?mo=senadores&ac=periodos&tipo=${tipo}`;

function parseId(texto: string): number {
  const regex = /id=(\d+)/; // Expresión regular para encontrar "id=" seguido de números
  const match = texto.match(regex);

  if (match) {
    return +match[1];
  } else {
    return 0;
  }
}

function parsePeriodo(texto: string): Periodo[] {
  const periodos: Periodo[] = [];

  const regex = /([SD]):\s*(\d{4})-(\d{4})/g;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    periodos.push({
      tipo: match[1] as PeriodoTipo,
      rango: {
        inicio: +match[2],
        fin: +match[3]
      }
    });
  }

  return periodos;
}

export const getSaveSenadoresPeriodos = async () => {
  const periodoSenadorArray: PeriodoSenador[] = [];
  periodoSenadorArray.push(...await getSenadoresPeriodos(Tipo.ANTERIORES));
  periodoSenadorArray.push(...await getSenadoresPeriodos(Tipo.ACTUALES));

  await Promise.all([
    saveJsonStructured(periodoSenadorArray),
    saveJsonLines(periodoSenadorArray),
  ]);

  return;
}

export const getSenadoresPeriodos = async (tipo: Tipo): Promise<PeriodoSenador[]> => {

  const periodoSenadorArray: PeriodoSenador[] = [];

  const page = await axios.get(getSenadoresPeriodoUrl(tipo));
  const $ = cheerio.load(page.data);

  $('div.col1 table tbody tr')
    .each((i, row) => {
      if(i === 0) return;
      const data = $(row)
        .find(':scope > *')
        .toArray()
        .map(td => $(td).text().trim());
      const url = $(row).find('td a').attr('href') as string;

      periodoSenadorArray.push({
        id: parseId(url),
        nombre: data[0],
        periodos: parsePeriodo(data[1]),
      })
    });

  return periodoSenadorArray;
}

const JSON_BUCKET_KEY = 'Senadores/Periodos/JsonStructured/data.json';
const JSON_LINE_BUCKET_KEY = 'Senadores/Periodos/JsonLines/data.jsonl';

const saveJsonStructured = async (periodoSenadorArray: PeriodoSenador[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: Commons.Constants.S3_BUCKET_SENADO,
    Key: JSON_BUCKET_KEY,
    Body: JSON.stringify(periodoSenadorArray)
  }));
}

const saveJsonLines = async (periodoSenadorArray: PeriodoSenador[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: Commons.Constants.S3_BUCKET_SENADO,
    Key: JSON_LINE_BUCKET_KEY,
    Body: periodoSenadorArray.map(
      ps => JSON.stringify(ps)
    ).join('\n')
  }));
}

export const getParlIdArray = async () => {
  const data: PeriodoSenador[] = JSON.parse(await Commons.Fn.getFileFromS3(JSON_BUCKET_KEY)) as PeriodoSenador[];

  return data.map(d => d.id);
}
