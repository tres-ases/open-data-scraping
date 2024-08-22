import axios from "axios";
import * as cheerio from "cheerio";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getVotacionesUrl, VOTACIONES_URL} from "./votaciones.constants";
import {Legislatura, LegislaturaSimple, VotacionesBucketKey} from "@senado-cl/global/votaciones";
import {MainBucketKey} from "@senado-cl/global";

const s3Client = new S3Client({});

export const getSaveLegislaturaSimpleList = async (cantidad: number = 0): Promise<{ legisId: number }[]> => {
  const list: LegislaturaSimple[] = [];

  const getLegislaturas = await axios.get(VOTACIONES_URL);
  const $ = cheerio.load(getLegislaturas.data);

  const legisOptions = $('select[name="legislaturas"] > option');

  for (const option of legisOptions) {
    const id = $(option).attr('value');
    const match = $(option).text().match(/(\d+)\s*\((\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})\)/);
    if (id !== undefined && +id > 0 && match) {
      list.push({
        id: +id,
        numero: +match[1],
        desde: match[2],
        hasta: match[3],
      });
    }
  }

  await saveLegislaturaSimpleList(list);
  if(cantidad > 0) {
    return list.slice(0, cantidad).map(l => ({legisId: l.id}));
  }
  return list.map(l => ({legisId: l.id}));
}

export const getSaveLegislaturaSesiones = async (legisId: number): Promise<Legislatura | undefined> => {
  const getSesiones = await axios.get(getVotacionesUrl(legisId));
  const $ = cheerio.load(getSesiones.data);

  const selected = $('select[name="legislaturas"] > option[selected]');
  const id = $(selected).attr('value');
  const match = $(selected).text().match(/(\d+)\s*\((\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})\)/);
  if (id !== undefined && +id > 0 && match) {
    const legislatura: Legislatura = {
      id: +id,
      numero: +match[1],
      desde: match[2],
      hasta: match[3],
      sesiones: []
    };

    const sesionesOptions = $('select[name="sesionessala"] > option');

    for (const option of sesionesOptions) {
      const id = $(option).attr('value');
      const nombre = $(option).text();
      const {numero, tipo, fecha} = parseSesionNombre(nombre);
      if (id !== undefined && id !== "0")
        legislatura.sesiones.push({
          id: +id,
          nombre,
          numero, tipo, fecha,
        });
    }

    await Promise.all([
      saveLegislatura(legislatura),
      saveSesionesList(legislatura)
    ])

    return legislatura;
  }

  return undefined;
}

const saveLegislatura = async (legislatura: Legislatura) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: MainBucketKey.S3_BUCKET,
    Key: VotacionesBucketKey.legislaturaDetalleJsonStructured(legislatura.id),
    Body: JSON.stringify(legislatura)
  }))
};

const saveLegislaturaSimpleList = async (legislaturas: LegislaturaSimple[]) => {
  await Promise.all([
    s3Client.send(new PutObjectCommand({
      Bucket: MainBucketKey.S3_BUCKET,
      Key: VotacionesBucketKey.legislaturaListJsonStructured,
      Body: JSON.stringify(legislaturas)
    })),
    s3Client.send(new PutObjectCommand({
      Bucket: MainBucketKey.S3_BUCKET,
      Key: VotacionesBucketKey.legislaturaListJsonLines,
      Body: legislaturas.map(
        l => JSON.stringify(l)
      ).join('\n')
    })),
  ]);
};

const saveSesionesList = async (legislatura: Legislatura) => {
  await Promise.all([
    s3Client.send(new PutObjectCommand({
      Bucket: MainBucketKey.S3_BUCKET,
      Key: VotacionesBucketKey.sesionListJsonStructured(legislatura.id),
      Body: JSON.stringify(legislatura.sesiones)
    })),
    s3Client.send(new PutObjectCommand({
      Bucket: MainBucketKey.S3_BUCKET,
      Key: VotacionesBucketKey.sesionListJsonLines(legislatura.id),
      Body: legislatura.sesiones.map(
        s => JSON.stringify(s)
      ).join('\n')
    })),
  ]);
};

const parseSesionNombre: (texto: string) => { numero?: number, tipo?: string, fecha?: string } = (texto) => {
  const regex = /Nº\s*(\d+)\s+(\w+)\s+en\s+(\w+)\s+(\d+)\s+de\s+(\w+)\s+de\s+(\d{4})/;
  const match = texto.match(regex);

  if (match) {
    const numero = +match[1];
    const tipo = match[2];
    const diaMes = match[4].padStart(2, '0'); // Asegura que el día tenga dos dígitos
    const mes = match[5];
    const ano = match[6];

    // Convertir el nombre del mes a su número correspondiente
    const meses: { [nombre: string]: string } = {
      "Enero": "01",
      "Febrero": "02",
      "Marzo": "03",
      "Abril": "04",
      "Mayo": "05",
      "Junio": "06",
      "Julio": "07",
      "Agosto": "08",
      "Septiembre": "09",
      "Octubre": "10",
      "Noviembre": "11",
      "Diciembre": "12"
    };
    const numeroMes = meses[mes];

    return {numero, tipo, fecha: `${diaMes}-${numeroMes}-${ano}`}
  }
  return {};
}
