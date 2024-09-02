import { Handler } from 'aws-lambda';
import {getLegislaturas, saveLegislaturas} from "./legislaturas.service";
import {Legislatura} from "@senado-cl/global/legislaturas";

export const getLegislaturasHandler: Handler<Legislatura[]> = async () => {
  return await getLegislaturas();
}

export const getSaveLegislaturasHandler: Handler<Legislatura[]> = async () => {
  return await saveLegislaturas(await getLegislaturas());
}
