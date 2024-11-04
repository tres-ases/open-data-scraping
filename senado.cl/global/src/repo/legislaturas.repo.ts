import {LegislaturasBucketKey, MainBucketKey} from "../config";
import {LegislaturaDtl, LegislaturaMapDtl, LegislaturaRaw} from "../model";
import {S3Location, S3ParamsRepo, S3SimpleRepo} from "@open-data-scraping/commons";

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: LegislaturasBucketKey.dtlDetailJson('{legId}') })
export class LegislaturaDtlRepo extends S3ParamsRepo<LegislaturaDtl, {legId: string | number}> {}

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: LegislaturasBucketKey.rawJson })
export class LegislaturaRawListRepo extends S3SimpleRepo<LegislaturaRaw[]> {}

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: LegislaturasBucketKey.dtlJson })
export class LegislaturaMapDtlRepo extends S3SimpleRepo<LegislaturaMapDtl> {}
