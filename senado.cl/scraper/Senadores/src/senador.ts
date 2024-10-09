import {Handler} from "aws-lambda";
import { SQSHandler } from 'aws-lambda';
import {detectNewSlugs, getSaveSenador} from "./senador.service";

interface GetSaveHandlerProps {
  slug: string
}

export const getSaveHandler: Handler<GetSaveHandlerProps> = async ({slug}) => {
  return await getSaveSenador(slug);
}

export const getSaveQueueHandler: SQSHandler = async ({Records}) => {
  await Promise.all(
    Records.map(async (record) => detectNewSlugs(record.body))
  )
}

interface DetectNewSlugsHandlerProps {
  legId: string
}

export const detectNewSlugsHandler: Handler<DetectNewSlugsHandlerProps> = async ({legId}) => {
  return await detectNewSlugs(legId);
}
