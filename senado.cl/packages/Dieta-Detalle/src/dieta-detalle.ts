import {Handler} from "aws-lambda";
import {getSaveDietas} from "./dieta-detalle.service";

export const getSaveDietasHandler: Handler<{ano: string, mes: string}> = async ({ano, mes}, context) => {
  try {
    const result = await getSaveDietas(ano, mes);
    console.log('dietas', ano, mes, result);
    return;
  } catch (err) {
    console.log(err);
    return "ERROR"
  }
};
