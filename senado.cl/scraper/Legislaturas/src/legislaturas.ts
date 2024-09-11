import {Handler} from 'aws-lambda';
import {distillSaveLegislatura, getLegislaturas, getSaveLegislaturas} from "./legislaturas.service";

export const getLegislaturasHandler: Handler = async () => {
  return await getLegislaturas();
}

export const getSaveLegislaturasHandler: Handler = async () => {
  return await getSaveLegislaturas();
}

interface DistillSaveLegislaturaHandlerProps {
  legId: string
}

export const distillSaveLegislaturaHandler: Handler<DistillSaveLegislaturaHandlerProps> = async ({legId}) => {
  return await distillSaveLegislatura(legId);
}
