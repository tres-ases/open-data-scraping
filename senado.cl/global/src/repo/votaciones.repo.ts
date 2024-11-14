import {S3Location, S3ParamsRepo} from "@open-data-scraping/commons";
import {MainBucketKey, SesionesBucketKey, VotacionesBucketKey} from "../config";
import {VotacionRaw} from "../model";
import {VotacionDetalleTable, VotacionTable} from "../model/Votaciones";

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: SesionesBucketKey.rawVotacionJson('{sesId}') })
export class VotacionRawListRepo extends S3ParamsRepo<VotacionRaw[], {sesId: string | number}> {}

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: VotacionesBucketKey.table('{sesId}') })
export class VotacionTableListRepo extends S3ParamsRepo<VotacionTable[], {sesId: string | number}> {}

@S3Location({ bucket: MainBucketKey.S3_BUCKET, keyTemplate: VotacionesBucketKey.tableDetalle('{votId}') })
export class VotacionDetalleTableListRepo extends S3ParamsRepo<VotacionDetalleTable[], {votId: string | number}> {}
