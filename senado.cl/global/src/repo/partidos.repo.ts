import {S3Location, S3SimpleRepo} from "@open-data-scraping/commons/dist";
import {MainBucketKey, PartidosBucketKey} from "../config";
import {PartidosMapDtl} from "../model";

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: PartidosBucketKey.dtlMap })
export class PartidosMapDtlRepo extends S3SimpleRepo<PartidosMapDtl> {}
