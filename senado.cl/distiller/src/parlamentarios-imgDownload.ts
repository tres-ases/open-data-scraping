import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {GetObjectCommand, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {S3Event, SQSEvent} from "aws-lambda";
import * as cheerio from "cheerio";

const serviceName = 'ParlamentariosDownloadImageFromQueue';
const logger = new Logger({
  logLevel: 'INFO',
  serviceName
});
const tracer = new Tracer({serviceName});

const s3Client = tracer.captureAWSv3Client(new S3Client({}));

export class ImgDownload implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler(event: SQSEvent, _context: any) {
    logger.info('Ejecutando ImgDownload', {event});

  }

  @tracer.captureMethod()
  public async saveFile(content: any, bucket: string, key: string) {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(content),
      ContentType: 'application/json'
    }));
  }
}

const instance = new ImgDownload();
export const handler = instance.handler.bind(instance);
