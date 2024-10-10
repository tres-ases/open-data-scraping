import {Handler} from "aws-lambda";
import { SQSHandler } from 'aws-lambda';
import {detectNewSlugs, getSaveSenador} from "./senadores.service";

interface GetSaveQueueHandlerProps {
  slug: string
}

export const getSaveHandler: Handler<GetSaveQueueHandlerProps> = async ({slug}) => {
  return await getSaveSenador(slug);
}

export const getSaveQueueHandler: SQSHandler = async ({Records}) => {
  await Promise.all(
    Records.map(async (record) => getSaveSenador(record.body))
  )
}

interface DetectNewSlugsHandlerProps {
  legId: string
}

export const detectNewSlugsHandler: Handler<DetectNewSlugsHandlerProps> = async ({legId}) => {
  return await detectNewSlugs(legId);
}
