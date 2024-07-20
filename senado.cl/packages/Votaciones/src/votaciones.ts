import {Handler} from "aws-lambda";
import {getSaveLegislaturaSesiones, getSaveLegislaturaSimpleList} from "./votaciones-legislatura.service";
import {getLegislaturasSesionesIdSinVotacionSimple, getSaveVotacionSimpleList} from "./votaciones.service";
import {LegislaturasSesionesId} from "./votaciones.model";

export const getSaveLegislaturasHandler: Handler<{cantidad: number}> = async ({cantidad}) => {
  return await getSaveLegislaturaSimpleList(cantidad);
};

export const getSaveLegislaturasSesionesHandler: Handler<{legisId: number}> = async ({legisId}) => {
  return await getSaveLegislaturaSesiones(legisId);
};

export const getLegislaturasSesionesIdSinVotacionResumenHandler: Handler = async () => {
  return await getLegislaturasSesionesIdSinVotacionSimple();
};

export const getSaveVotacionSimpleListHandler: Handler<LegislaturasSesionesId> = async ({legisId, sesionId}) => {
  return await getSaveVotacionSimpleList(legisId, sesionId);
};
