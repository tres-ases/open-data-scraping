import {LegislaturasBucketKey, MainBucketKey} from "../config";
import {LegislaturaDtl} from "../model";
import {S3Location, S3ParamsRepo} from "@open-data-scraping/commons/dist";

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: LegislaturasBucketKey.distilledDetailJson('{legId}') })
export class LegislaturaDtlRepo extends S3ParamsRepo<LegislaturaDtl, {legId: string | number}> {}
