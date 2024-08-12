import {Handler} from "aws-lambda";
import {getAnoMesArray, getAnoMesParlIdArray, getSaveData} from "./gastos-operacionales.service";
import {AnoMesParl} from "@senado-cl/global/gastos-operacionales";
import {AnoMes} from "@senado-cl/global/dieta";

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
