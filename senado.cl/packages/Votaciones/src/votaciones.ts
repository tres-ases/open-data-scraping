import {Handler} from "aws-lambda";
import {getSaveLegislaturaSesiones, getSaveLegislaturaSimpleList} from "./votaciones-legislatura.service";

export const getSaveLegislaturasHandler: Handler<{cantidad: number}> = async ({cantidad}) => {
  return await getSaveLegislaturaSimpleList(cantidad);
};

export const getSaveLegislaturasSesionesHandler: Handler<{legisId: number}> = async ({legisId}) => {
  return await getSaveLegislaturaSesiones(legisId);
};
