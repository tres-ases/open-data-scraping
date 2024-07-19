import {Handler} from "aws-lambda";
import {getSaveLegislaturaSesiones, getSaveLegislaturaSimpleList} from "./votaciones-legislatura.service";

export const getSaveLegislaturasHandler: Handler = async () => {
  return await getSaveLegislaturaSimpleList();
};

export const getSaveLegislaturasSesionesHandler: Handler<{legisId: number}> = async ({legisId}) => {
  return await getSaveLegislaturaSesiones(legisId);
};
