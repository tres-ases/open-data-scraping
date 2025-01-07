import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import axios from "axios";
import {Readable} from "stream";
import {SQSEvent} from "aws-lambda";

const serviceName = 'ParlamentariosDownloadImageFromQueue';
const logger = new Logger({
  logLevel: 'INFO',
  serviceName
});
const tracer = new Tracer({serviceName});

const s3Client = tracer.captureAWSv3Client(new S3Client({}));

interface Data {
  slug: string
  tipo: string
  url: string
}

export class ImgDownload implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler(event: SQSEvent, _context: any) {
    logger.info('Ejecutando ImgDownload', {event});
    for (const {body} of event.Records) {
      const data = JSON.parse(body) as Data;
      await this.downloadAndSaveImg(data)
    }
  }

  @tracer.captureMethod()
  public async downloadAndSaveImg({slug, tipo, url}: Data) {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    const buffer = Buffer.from(response.data);
    const Key = `img/parlametarios/slug=${slug}/${tipo}.jpg`;

    const putCommand = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key,
      Body: Readable.from(buffer),
      ContentType: 'image/jpeg',
      ContentLength: buffer.length
    });

    await s3Client.send(putCommand);
    console.log('File saved to S3', {Key});
  }
}

const instance = new ImgDownload();
export const handler = instance.handler.bind(instance);
