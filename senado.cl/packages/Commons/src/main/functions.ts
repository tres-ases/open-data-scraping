import {GetObjectCommand, HeadObjectCommand, S3Client} from "@aws-sdk/client-s3";
import * as _ from "lodash";
import Constants from "./constants";
import {AnoMes} from "./model";

const s3Client = new S3Client({});

function last6months(): AnoMes[] {
  const anoMesArray: AnoMes[] = [];

  const fechaActual = new Date();
  for (let i = 0; i < 6; i++) {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setMonth(fechaActual.getMonth() - i);

    anoMesArray.push({
      ano: nuevaFecha.getFullYear(),
      mes: (nuevaFecha.getMonth() + 1)
    });
  }

  return anoMesArray;
}

function getAnoMesArray(ano?: number): AnoMes[] {

  if(ano === undefined) return last6months();

  const fechaActual = new Date();
  const anoActual: number = fechaActual.getFullYear();

  if(ano > anoActual || ano < 2012) return [];

  let mesFin = 12;
  if(anoActual === ano) mesFin = fechaActual.getMonth() + 1;

  const anoMesArray: AnoMes[] = [];

  for (let mes = 1; mes <= mesFin; mes++) {
    anoMesArray.push({ano, mes});
  }

  return anoMesArray;
}

async function getFileFromS3(key: string): Promise<string> {
  try {
    const response = await s3Client.send(new GetObjectCommand({Bucket: Constants.S3_BUCKET_SENADO, Key: key}));
    // The Body object also has 'transformToByteArray' and 'transformToWebStream' methods.
    const str = await response.Body!.transformToString();
    console.log(str);
    return str;
  } catch (error) {
    console.error("Error al obtener el archivo de S3:", error);
    throw error; // o maneja el error de otra forma
  }
}

async function existsFromS3(key: string): Promise<boolean> {
  const command = new HeadObjectCommand({Bucket: Constants.S3_BUCKET_SENADO, Key: key,});
  try {
    await s3Client.send(command);
    return true; // La clave existe
  } catch (error) {
    if (error.name === 'NotFound') {
      return false; // La clave no existe
    } else {
      throw error; // Otro tipo de error (permisos, red, etc.)
    }
  }
}

function flattenObject(obj: any) {
  let toReturn: { [k: string]: any } = {};

  for (let i in obj) {
    if (!obj.hasOwnProperty(i)) continue;

    if ((typeof obj[i]) === 'object' && obj[i] !== null) {
      let flatObject = flattenObject(obj[i]);
      for (let x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;

        toReturn[i + '.' + x] = flatObject[x];
      }
    } else {
      toReturn[i] = obj[i];
    }
  }
  return toReturn;
}

export function cleanNumber(text: string): number {
  return +_.trim(text.replace(/[$,.]/g, ""));
}

export default {
  flattenObject, cleanNumber, getFileFromS3, existsFromS3, getAnoMesArray
}
