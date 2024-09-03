import {Handler} from "aws-lambda";
import {getSaveSesiones} from "./sesiones.service";

interface GetSaveSesionesHandlerProps {
  legId: string
}

export const getSaveSesionesHandler: Handler<GetSaveSesionesHandlerProps> = async ({legId}) => {
  return await getSaveSesiones(legId);
}
