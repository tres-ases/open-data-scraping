import {Handler} from "aws-lambda";
import {detectNewSlugs, getSaveSenador} from "./senador.service";

interface GetSaveHandlerProps {
  slug: string
}

export const getSaveHandler: Handler<GetSaveHandlerProps> = async ({slug}) => {
  return await getSaveSenador(slug);
}

interface DetectNewSlugsHandlerProps {
  legId: string
}

export const detectNewSlugsHandler: Handler<DetectNewSlugsHandlerProps> = async ({legId}) => {
  return await detectNewSlugs(legId);
}
