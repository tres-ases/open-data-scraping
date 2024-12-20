import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {SQSEvent} from "aws-lambda";
import * as https from 'https';

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
  public async downloadAndSaveImg(slug: string, url: string, tipo: string) {
    const imageData = await this.downloadImage(url);
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `img/parlametarios/slug=${slug}/${tipo}.jpg`,
      Body: imageData,
      ContentType: 'image/jpeg'
    }));
  }

  @tracer.captureMethod()
  private downloadImage(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      https.get(url, (response) => {
        const chunks: Uint8Array[] = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', (err) => reject(err));
      });
    });
  }
}

const instance = new ImgDownload();
export const handler = instance.handler.bind(instance);
