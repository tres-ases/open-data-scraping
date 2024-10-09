import {S3Location, S3ParamsRepo} from "@open-data-scraping/commons";
import {MainBucketKey, SesionesBucketKey} from "../config";
import {VotacionRaw} from "../model";

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SesionesBucketKey.rawVotacionJson('{sesId}') })
export class VotacionRawListRepo extends S3ParamsRepo<VotacionRaw[], {sesId: string | number}> {}
