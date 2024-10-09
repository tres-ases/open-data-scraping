import {S3Location, S3ParamsRepo} from "@open-data-scraping/commons";
import {MainBucketKey, SesionesBucketKey} from "../config";
import {LegislaturaSesionDtl, SesionRaw} from "../model";

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SesionesBucketKey.rawDetalleJson('{sesId}') })
export class SesionRawRepo extends S3ParamsRepo<SesionRaw, {sesId: string | number}> {}

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SesionesBucketKey.rawListJson('{legId}') })
export class SesionRawListRepo extends S3ParamsRepo<SesionRaw[], {legId: string | number}> {}

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SesionesBucketKey.dtlJson('{sesId}') })
export class LegislaturaSesionDtlRepo extends S3ParamsRepo<LegislaturaSesionDtl, {sesId: string | number}> {}
