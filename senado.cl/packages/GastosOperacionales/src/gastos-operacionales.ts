import {Handler} from "aws-lambda";
import {getAnoMesArrayGroups, getAnoMesParlIdArray, getSaveData} from "./gastos-operacionales.service";
import {AnoMesParl} from "./gastos-operacionales.model";
import {AnoMes} from "@senado-cl/commons/model";

export const getAnoMesArrayGroupsHandler: Handler<{ anoMin: number, mesMin: number }> = async ({anoMin, mesMin}) => {
  return getAnoMesArrayGroups(anoMin, mesMin);
};

export const getAnoMesParlIdArrayHandler: Handler<AnoMes[]> = async (anoMesArray) => {
  return await getAnoMesParlIdArray(anoMesArray);
};

export const mergeAnoMesParlIdArrayHandler: Handler<AnoMesParl[][]> = async (anoMesParlIdArrays) => {
  const anoMesParlIdArray: AnoMesParl[] = [];
  anoMesParlIdArrays.forEach(items => anoMesParlIdArray.push(...items));
  return anoMesParlIdArray;
};

export const getSaveDataHandler: Handler<AnoMesParl> = async ({ano, mes, parlId}) => {
  return await getSaveData(ano, mes, parlId);
}
