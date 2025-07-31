import { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';

// Base input schema for all extractors
export const BaseExtractorInputSchema = z.object({
  source: z.enum(['senado', 'camara', 'servel']),
  dataType: z.enum(['legislators', 'sessions', 'votes', 'expenses', 'projects', 'elections']),
  batchSize: z.number().min(1).max(1000).default(100),
  retryCount: z.number().min(0).max(5).default(0),
  maxRetries: z.number().min(1).max(5).default(3),
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
});

export type BaseExtractorInput = z.infer<typeof BaseExtractorInputSchema>;

// Base response schema
export const BaseExtractorResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    recordsExtracted: z.number(),
    recordsStored: z.number(),
    s3Location: z.string().optional(),
    errors: z.array(z.string()),
    processingTime: z.number(),
  }).optional(),
  error: z.string().optional(),
});

export type BaseExtractorResponse = z.infer<typeof BaseExtractorResponseSchema>;

// Raw data batch interface
export interface RawDataBatch {
  source: string;
  dataType: string;
  timestamp: string;
  records: Record<string, any>[];
  metadata: {
    extractionId: string;
    batchNumber: number;
    totalBatches: number;
    url?: string;
    userAgent?: string;
  };
}

// Extraction result interface
export interface ExtractionResult {
  success: boolean;
  recordsExtracted: number;
  recordsStored: number;
  s3Location?: string;
  errors: string[];
  processingTime: number;
}

/**
 * Abstract base class for all data extractors
 * Implements LambdaInterface and provides common functionality
 */
export abstract class BaseDataExtractor implements LambdaInterface {
  protected logger: Logger;
  protected tracer: Tracer;
  protected metrics: Metrics;
  protected s3Client: S3Client;
  protected dynamoClient: DynamoDBClient;

  constructor(serviceName: string) {
    this.logger = new Logger({ serviceName });
    this.tracer = new Tracer({ serviceName });
    this.metrics = new Metrics({
      namespace: 'ODM',
      serviceName,
      defaultDimensions: {
        Environment: process.env.NODE_ENV || 'dev',
      }
    });

    this.s3Client = new S3Client({ region: process.env.AWS_REGION });
    this.dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
  }

  /**
   * Main Lambda handler - implements LambdaInterface
   */
  public async handler(event: BaseExtractorInput): Promise<BaseExtractorResponse> {
    const startTime = Date.now();

    try {
      // Validate input
      const validatedInput = BaseExtractorInputSchema.parse(event);

      this.logger.info('Starting data extraction', {
        source: validatedInput.source,
        dataType: validatedInput.dataType,
        batchSize: validatedInput.batchSize,
      });

      // Add metrics
      this.metrics.addMetric('ExtractionStarted', MetricUnit.Count, 1);
      this.metrics.addDimensions({
        Source: validatedInput.source,
        DataType: validatedInput.dataType,
      });

      // Execute extraction
      const result = await this.executeExtraction(validatedInput);

      const processingTime = Date.now() - startTime;

      // Add success metrics
      this.metrics.addMetric('ExtractionSuccess', MetricUnit.Count, 1);
      this.metrics.addMetric('RecordsExtracted', MetricUnit.Count, result.recordsExtracted);
      this.metrics.addMetric('ProcessingTime', MetricUnit.Milliseconds, processingTime);

      this.logger.info('Extraction completed successfully', {
        recordsExtracted: result.recordsExtracted,
        recordsStored: result.recordsStored,
        processingTime,
      });

      return {
        success: true,
        message: `Successfully extracted ${result.recordsExtracted} records`,
        data: {
          ...result,
          processingTime,
        },
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.logger.error('Extraction failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        processingTime,
      });

      this.metrics.addMetric('ExtractionError', MetricUnit.Count, 1);
      this.metrics.addMetric('ProcessingTime', MetricUnit.Milliseconds, processingTime);

      return {
        success: false,
        message: 'Extraction failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Abstract method to be implemented by concrete extractors
   */
  protected abstract executeExtraction(input: BaseExtractorInput): Promise<ExtractionResult>;

  /**
   * Get configuration parameter from SSM
   */
  protected async getParameter(parameterName: string): Promise<string> {
    try {
      const value = await getParameter(parameterName);
      return value || '';
    } catch (error) {
      this.logger.warn('Failed to get parameter', { parameterName, error });
      throw new Error(`Failed to get parameter: ${parameterName}`);
    }
  }

  /**
   * Store raw data batch to S3
   */
  protected async storeRawData(batch: RawDataBatch): Promise<string> {
    const bucketName = process.env.DATA_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('DATA_BUCKET_NAME environment variable not set');
    }

    const timestamp = new Date().toISOString();
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(5, 7);
    const day = timestamp.substring(8, 10);

    const key = `raw/${batch.source}/${batch.dataType}/year=${year}/month=${month}/day=${day}/${batch.metadata.extractionId}-${batch.metadata.batchNumber}.json`;

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: JSON.stringify(batch, null, 2),
        ContentType: 'application/json',
        ServerSideEncryption: 'AES256',
        Metadata: {
          source: batch.source,
          dataType: batch.dataType,
          extractionId: batch.metadata.extractionId,
          batchNumber: batch.metadata.batchNumber.toString(),
          recordCount: batch.records.length.toString(),
        },
      });

      await this.s3Client.send(command);

      this.logger.info('Raw data stored to S3', {
        key,
        recordCount: batch.records.length,
      });

      return `s3://${bucketName}/${key}`;
    } catch (error) {
      this.logger.error('Failed to store raw data to S3', { error, key });
      throw error;
    }
  }

  /**
   * Store extraction metadata to DynamoDB
   */
  protected async storeExtractionMetadata(
    extractionId: string,
    input: BaseExtractorInput,
    result: ExtractionResult
  ): Promise<void> {
    const tableName = process.env.SESSIONS_TABLE_NAME; // Using sessions table for metadata
    if (!tableName) {
      throw new Error('SESSIONS_TABLE_NAME environment variable not set');
    }

    const timestamp = new Date().toISOString();

    const item = {
      PK: `EXTRACTION#${input.source}#${input.dataType}`,
      SK: `${timestamp}#${extractionId}`,
      extractionId,
      source: input.source,
      dataType: input.dataType,
      timestamp,
      recordsExtracted: result.recordsExtracted,
      recordsStored: result.recordsStored,
      success: result.success,
      processingTime: result.processingTime,
      s3Location: result.s3Location,
      errors: result.errors,
      ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days TTL
    };

    try {
      const command = new PutItemCommand({
        TableName: tableName,
        Item: marshall(item),
      });

      await this.dynamoClient.send(command);

      this.logger.info('Extraction metadata stored', { extractionId });
    } catch (error) {
      this.logger.error('Failed to store extraction metadata', { error, extractionId });
      // Don't throw - metadata storage failure shouldn't fail the extraction
    }
  }

  /**
   * Retry mechanism with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt === maxRetries) {
          this.logger.error('Max retries exceeded', {
            attempt,
            maxRetries,
            error: lastError.message,
          });
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        this.logger.warn('Operation failed, retrying', {
          attempt,
          maxRetries,
          delay,
          error: lastError.message,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Generate unique extraction ID
   */
  protected generateExtractionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Validate URL format
   */
  protected validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clean and normalize text data
   */
  protected cleanText(text: string): string {
    if (!text || typeof text !== 'string') return '';

    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[\r\n\t]/g, ' ')
      .replace(/[^\x20-\x7E\u00C0-\u017F\u1E00-\u1EFF]/g, ''); // Keep ASCII + Latin extended
  }

  /**
   * Parse date string to ISO format
   */
  protected parseDate(dateStr: string): string | null {
    if (!dateStr) return null;

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
      return null;
    }
  }
}
