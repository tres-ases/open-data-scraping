import { SenadoLegislatorsExtractor } from './legislators-extractor';
import { SenadoVotesExtractor } from './votes-extractor';

// Unit tests with mocked network calls
describe('Extractor Unit Tests', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env.DATA_BUCKET_NAME = 'test-bucket';
    process.env.SESSIONS_TABLE_NAME = 'test-table';
    process.env.AWS_REGION = 'us-east-1';
    process.env.NODE_ENV = 'test';
  });

  describe('SenadoLegislatorsExtractor', () => {
    let extractor: SenadoLegislatorsExtractor;

    beforeEach(() => {
      extractor = new SenadoLegislatorsExtractor();
    });

    it('should handle extraction with mocked data', async () => {
      const input = {
        source: 'senado' as const,
        dataType: 'legislators' as const,
        batchSize: 5,
      };

      // Mock all external dependencies
      const mockStoreRawData = jest.fn().mockResolvedValue('s3://test-bucket/test-key');
      const mockStoreMetadata = jest.fn().mockResolvedValue(undefined);
      const mockExecuteExtraction = jest.fn().mockResolvedValue({
        success: true,
        recordsExtracted: 5,
        recordsStored: 5,
        s3Location: 's3://test-bucket/test-key',
        errors: [],
        processingTime: 1000,
      });

      (extractor as any).storeRawData = mockStoreRawData;
      (extractor as any).storeExtractionMetadata = mockStoreMetadata;
      (extractor as any).executeExtraction = mockExecuteExtraction;

      const result = await extractor.handler(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(mockExecuteExtraction).toHaveBeenCalledWith(expect.objectContaining({
        source: input.source,
        dataType: input.dataType,
        batchSize: input.batchSize,
      }));
    });

    it('should handle extraction errors gracefully', async () => {
      const input = {
        source: 'senado' as const,
        dataType: 'legislators' as const,
        batchSize: 5,
      };

      // Mock extraction failure
      const mockExecuteExtraction = jest.fn().mockRejectedValue(new Error('Network error'));

      (extractor as any).executeExtraction = mockExecuteExtraction;

      const result = await extractor.handler(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('SenadoVotesExtractor', () => {
    let extractor: SenadoVotesExtractor;

    beforeEach(() => {
      extractor = new SenadoVotesExtractor();
    });

    it('should handle votes extraction with mocked data', async () => {
      const input = {
        source: 'senado' as const,
        dataType: 'votes' as const,
        batchSize: 3,
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      };

      // Mock all external dependencies
      const mockStoreRawData = jest.fn().mockResolvedValue('s3://test-bucket/test-key');
      const mockStoreMetadata = jest.fn().mockResolvedValue(undefined);
      const mockExecuteExtraction = jest.fn().mockResolvedValue({
        success: true,
        recordsExtracted: 10,
        recordsStored: 10,
        s3Location: 's3://test-bucket/test-key',
        errors: [],
        processingTime: 2000,
      });

      (extractor as any).storeRawData = mockStoreRawData;
      (extractor as any).storeExtractionMetadata = mockStoreMetadata;
      (extractor as any).executeExtraction = mockExecuteExtraction;

      const result = await extractor.handler(input);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.recordsExtracted).toBe(10);
      expect(mockExecuteExtraction).toHaveBeenCalledWith(expect.objectContaining({
        source: input.source,
        dataType: input.dataType,
        batchSize: input.batchSize,
        dateRange: input.dateRange,
      }));
    });

    it('should validate input schema', async () => {
      const invalidInput = {
        source: 'invalid' as any,
        dataType: 'votes' as const,
        batchSize: -1, // Invalid batch size
      };

      const result = await extractor.handler(invalidInput);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Constructor Tests', () => {
    it('should create SenadoLegislatorsExtractor instance', () => {
      const extractor = new SenadoLegislatorsExtractor();
      expect(extractor).toBeDefined();
      expect((extractor as any).logger).toBeDefined();
    });

    it('should create SenadoVotesExtractor instance', () => {
      const extractor = new SenadoVotesExtractor();
      expect(extractor).toBeDefined();
      expect((extractor as any).logger).toBeDefined();
    });
  });
});
