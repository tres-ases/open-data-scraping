import {S3Location, S3ParamsRepo} from "@open-data-scraping/commons/dist";
import {MainBucketKey, SesionesBucketKey} from "../config";
import {SesionRaw, VotacionRaw} from "../model";

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SesionesBucketKey.rawDetalleJson('{sesId}') })
export class SesionRawRepo extends S3ParamsRepo<SesionRaw, {sesId: string | number}> {}

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SesionesBucketKey.rawListJson('{legId}') })
export class SesionRawListRepo extends S3ParamsRepo<SesionRaw[], {legId: string | number}> {}
