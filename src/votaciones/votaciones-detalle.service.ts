import {DETALLE_VOTACION_URL} from "../config";
import axios from 'axios';
import * as xml2js from 'xml2js';

export const getVotacionDetalle = async (boletin: string): Promise<any> => {
  if (boletin.indexOf('-') > 0) boletin = boletin.split('-')[0];
  if(/^\d+$/.test(boletin)) {
    try {
      const response = await axios.get(DETALLE_VOTACION_URL, {params: {boletin}});
      return await xmlToJson(response.data);
    } catch (err) {
      console.error('Error al obtener datos boletin', boletin);
    }
  }
  return null;
}

async function xmlToJson(xmlString: string): Promise<any> {
  return await new Promise((resolve, reject) => {
    xml2js.parseString(xmlString, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
