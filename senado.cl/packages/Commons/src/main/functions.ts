import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import * as _ from "lodash";
import Constants from "./constants";

const s3Client = new S3Client({});

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


function flattenObject(obj: any) {
  let toReturn:{[k: string]: any} = {};

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
  flattenObject, cleanNumber, getFileFromS3
}
