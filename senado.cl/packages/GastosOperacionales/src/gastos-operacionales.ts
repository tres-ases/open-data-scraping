import {Handler} from "aws-lambda";
import {getAnoMesParlIdArray, getSaveData} from "./gastos-operacionales.service";
import {AnoMesParl} from "./gastos-operacionales.model";

export const getAnoMesParlIdArrayHandler: Handler<{ anoMin: number, mesMin: number }> = async ({anoMin, mesMin}) => {
  return getAnoMesParlIdArray(anoMin, mesMin);
};

export const getSaveDataHandler: Handler<AnoMesParl> = async ({ano, mes, parlId}) => {
  return await getSaveData(ano, mes, parlId);
}
