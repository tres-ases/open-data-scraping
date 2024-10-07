import {S3Location, S3ParamsRepo, S3SimpleRepo} from "@open-data-scraping/commons";
import {SenadorMapRaw, SenadorRaw} from "../model";
import {MainBucketKey, SenadoresBucketKey} from "../config";

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SenadoresBucketKey.rawMap })
export class SenadorMapRawRepo extends S3SimpleRepo<SenadorMapRaw> {}

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SenadoresBucketKey.rawJson('{senId}') })
export class SenadorRawRepo extends S3ParamsRepo<SenadorRaw, {senId: string | number}> {}
