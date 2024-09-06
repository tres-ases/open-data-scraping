import {Handler} from "aws-lambda";
import {getSaveSenador} from "./senador.service";

interface GetSaveHandlerProps {
  slug: string
}

export const getSaveHandler: Handler<GetSaveHandlerProps> = async ({slug}) => {
  return await getSaveSenador(slug);
}
