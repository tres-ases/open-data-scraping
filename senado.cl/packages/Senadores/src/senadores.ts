import {getParlIdArray, getSaveSenadoresPeriodos} from "./senadores-periodos.service";
import {Handler} from "aws-lambda";
import {downloadSaveImages, getSaveDetalle} from "./senadores-detalle.service";


export const getSaveSenadoresPeriodosHandler: Handler = async () => {
  return await getSaveSenadoresPeriodos();
};

export const getParlIdArrayHandler: Handler = async () => {
  return await getParlIdArray();
}

export const getSaveDetailsHandler: Handler<{parlId: number}> = async ({parlId}) => {
  await Promise.all([
    downloadSaveImages(parlId),
    getSaveDetalle(parlId),
  ]);
}
