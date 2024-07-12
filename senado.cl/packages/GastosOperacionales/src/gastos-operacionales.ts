import {Handler} from "aws-lambda";
import {getAnoMesParlIdArray, getData} from "./gastos-operacionales.service";
import {AnoMesParl} from "./gastos-operacionales.model";

export const getAnoMesParlIdArrayHandler: Handler<{ anoMin: number, mesMin: number }> = async ({anoMin, mesMin}) => {
  return getAnoMesParlIdArray(anoMin, mesMin);
};

export const getDataHandler: Handler<AnoMesParl> = async ({ano, mes, parlId}) => {
  return await getData(ano, mes, parlId);
}
