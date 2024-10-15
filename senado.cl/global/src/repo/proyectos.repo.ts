import {S3Location, S3ParamsRepo, S3SimpleRepo} from "@open-data-scraping/commons";
import {ProyectosMapRaw, ProyectoRaw} from "../model";
import {MainBucketKey, ProyectosBucketKey} from "../config";

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: ProyectosBucketKey.rawMap })
export class ProyectosMapRawRepo extends S3SimpleRepo<ProyectosMapRaw> {}

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: ProyectosBucketKey.rawJson('{bolId}') })
export class ProyectosRawRepo extends S3ParamsRepo<ProyectoRaw, {bolId: string | number}> {}

