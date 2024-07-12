import {Handler} from "aws-lambda";
import {getAnoMesArray, getAnoMesParlIdArray, getSaveData} from "./gastos-operacionales.service";
import {AnoMesParl} from "./gastos-operacionales.model";
import {AnoMes} from "@senado-cl/commons/model";

export const getAnoMesArrayGroupsHandler: Handler<{ ano: number }> = async ({ano}) => {
  return getAnoMesArray(ano);
};

export const getAnoMesParlIdArrayHandler: Handler<AnoMes[]> = async (anoMesArray) => {
  return await getAnoMesParlIdArray(anoMesArray);
};

export const getSaveDataHandler: Handler<AnoMesParl> = async ({ano, mes, parlId}) => {
  await getSaveData(ano, mes, parlId);
  return 0;
}
