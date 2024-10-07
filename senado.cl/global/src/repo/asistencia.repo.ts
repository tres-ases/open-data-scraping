import {S3Location, S3ParamsRepo} from "@open-data-scraping/commons/dist";
import {MainBucketKey, SesionesBucketKey} from "../config";
import {AsistenciaRaw} from "../model";

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SesionesBucketKey.rawAsistenciaJson('{sesId}') })
export class AsistenciaRawRepo extends S3ParamsRepo<AsistenciaRaw, {sesId: string | number}> {}
