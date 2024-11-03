import {S3FileParamsRepo, S3Location, S3ParamsRepo, S3SimpleRepo} from "@open-data-scraping/commons";
import {SenadoresMapRaw, SenadorRaw} from "../model";
import {MainBucketKey, SenadoresBucketKey} from "../config";

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SenadoresBucketKey.rawMap })
export class SenadorMapRawRepo extends S3SimpleRepo<SenadoresMapRaw> {}

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SenadoresBucketKey.rawJson('{senSlug}') })
export class SenadorRawRepo extends S3ParamsRepo<SenadorRaw, {senSlug: string}> {}

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SenadoresBucketKey.img('{senSlug}', '{img}') })
export class SenadorImgRepo extends S3FileParamsRepo<{senSlug: string, img: string}> {}

