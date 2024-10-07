import "reflect-metadata";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import {Logger} from '@aws-lambda-powertools/logger';

const logger = new Logger();
const s3Client = new S3Client();

interface S3LocationParams {
  bucket: string
  keyTemplate: string
}

export function S3Location(params: S3LocationParams) {
  return function (target: any) {
    Reflect.defineMetadata("bucket", params.bucket, target);
    Reflect.defineMetadata("keyTemplate", params.keyTemplate, target);
  };
}

abstract class S3Repo<T> {
  protected bucket: string;
  protected keyTemplate: string;

  protected constructor() {
    this.bucket = Reflect.getMetadata("bucket", this.constructor);
    this.keyTemplate = Reflect.getMetadata("keyTemplate", this.constructor);
  }
}

export class S3SimpleRepo<T> extends S3Repo<T> {
  constructor() {
    super()
  }

  async save(data: T): Promise<void> {
    const jsonData = JSON.stringify(data);

    const putCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.keyTemplate,
      Body: jsonData,
      ContentType: "application/json",
    });

    await s3Client.send(putCommand);
    console.log(`Data saved to S3 at ${this.keyTemplate}`);
  }

  async get(): Promise<T | null> {
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.keyTemplate
      }));
      return JSON.parse(await response.Body!.transformToString()) as T;
    } catch (error) {
      logger.error(`Error getting data from S3 at ${this.keyTemplate}`, error);
      return null;
    }
  }
}

export class S3ParamsRepo<T, P extends Record<string, string | number>> extends S3Repo<T> {
  constructor() {
    super()
  }

  // Guardar un objeto en S3
  async save(data: T, params: P): Promise<T> {
    const key = this.buildS3Key(params);
    const jsonData = JSON.stringify(data);

    const putCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: jsonData,
      ContentType: "application/json",
    });

    await s3Client.send(putCommand);
    console.log(`Data saved to S3 at ${key}`);

    return data;
  }

  async getBy(params: P): Promise<T | null> {
    const key = this.buildS3Key(params);

    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      }));
      return JSON.parse(await response.Body!.transformToString()) as T;
    } catch (error) {
      logger.error(`Error getting data from S3 at ${key}`, error);
      return null;
    }
  }

  private buildS3Key(params: P): string {
    let key = this.keyTemplate;
    for (const [param, value] of Object.entries(params)) {
      key = key.replace(`{${param}}`, `${value}`);
    }
    return key;
  }
}
