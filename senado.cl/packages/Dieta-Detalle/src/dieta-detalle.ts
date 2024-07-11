import {Handler} from "aws-lambda";
import {getSaveDietas, mapMesAnoArrayDieta} from "./dieta-detalle.service";

export const getSaveDietasHandler: Handler<{ano: string, mes: string}> = async ({ano, mes}) => {
  try {
    const result = await getSaveDietas(ano, mes);
    console.log('dietas', ano, mes, result);
    return;
  } catch (err) {
    console.log(err);
    return "ERROR"
  }
};

export const mapMesAnoArrayDietaHandler: Handler<{ano: number, mes: number}> = async ({ano, mes}) => {
  try {
    return await mapMesAnoArrayDieta(ano, mes);
  } catch (err) {
    console.log(err);
    return "ERROR"
  }
}
