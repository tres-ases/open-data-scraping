import { SenadoLegislatorsExtractor } from './legislators-extractor';
import { SenadoVotesExtractor } from './votes-extractor';
import { SenadoSessionsExtractor } from './sessions-extractor';
import { SenadoExpensesExtractor } from './expenses-extractor';

// Tests de integración - estos requieren conexión a internet
// Para ejecutar estos tests: npm test -- --testNamePattern="Integration"
describe('Integration Tests', () => {
  // Configurar timeout más largo para requests de red
  const NETWORK_TIMEOUT = 30000;

  beforeEach(() => {
    // Mock environment variables necesarias para los tests
    process.env.DATA_BUCKET_NAME = 'test-bucket';
    process.env.SESSIONS_TABLE_NAME = 'test-table';
    process.env.AWS_REGION = 'us-east-1';
    process.env.NODE_ENV = 'test';
  });

  describe('SenadoLegislatorsExtractor Integration', () => {
    let extractor: SenadoLegislatorsExtractor;

    beforeEach(() => {
      extractor = new SenadoLegislatorsExtractor();
    });

    it('should extract legislators data structure', async () => {
      const input = {
        source: 'senado' as const,
        dataType: 'legislators' as const,
        batchSize: 5, // Limitar para test
      };

      try {
        // Mock the S3 and DynamoDB calls to avoid actual AWS calls
        const mockStoreRawData = jest.fn().mockResolvedValue('s3://test-bucket/test-key');
        const mockStoreMetadata = jest.fn().mockResolvedValue(undefined);

        (extractor as any).storeRawData = mockStoreRawData;
        (extractor as any).storeExtractionMetadata = mockStoreMetadata;

        const result = await extractor.handler(input);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Successfully extracted');
        expect(result.data).toBeDefined();
        expect(result.data?.recordsExtracted).toBeGreaterThanOrEqual(0);
        expect(result.data?.processingTime).toBeGreaterThan(0);

        // Verificar que se llamaron los métodos de almacenamiento
        if (result.data?.recordsExtracted && result.data.recordsExtracted > 0) {
          expect(mockStoreRawData).toHaveBeenCalled();
          expect(mockStoreMetadata).toHaveBeenCalled();
        }
      } catch (error) {
        // Si falla por problemas de red, skip el test
        if (error instanceof Error && (
          error.message.includes('ENOTFOUND') ||
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED')
        )) {
          console.warn('Skipping integration test due to network issues:', error.message);
          return;
        }
        throw error;
      }
    }, NETWORK_TIMEOUT);
  });

  describe('SenadoVotesExtractor Integration', () => {
    let extractor: SenadoVotesExtractor;

    beforeEach(() => {
      extractor = new SenadoVotesExtractor();
    });

    it('should extract votes data structure', async () => {
      const input = {
        source: 'senado' as const,
        dataType: 'votes' as const,
        batchSize: 3, // Limitar para test
        dateRange: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-31T23:59:59Z'
        }
      };

      try {
        // Mock the S3 and DynamoDB calls
        const mockStoreRawData = jest.fn().mockResolvedValue('s3://test-bucket/test-key');
        const mockStoreMetadata = jest.fn().mockResolvedValue(undefined);

        (extractor as any).storeRawData = mockStoreRawData;
        (extractor as any).storeExtractionMetadata = mockStoreMetadata;

        const result = await extractor.handler(input);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Successfully extracted');
        expect(result.data).toBeDefined();
        expect(result.data?.recordsExtracted).toBeGreaterThanOrEqual(0);
        expect(result.data?.processingTime).toBeGreaterThan(0);

      } catch (error) {
        if (error instanceof Error && (
          error.message.includes('ENOTFOUND') ||
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED')
        )) {
          console.warn('Skipping integration test due to network issues:', error.message);
          return;
        }
        throw error;
      }
    }, NETWORK_TIMEOUT);
  });

  describe('WebScraper Integration', () => {
    it('should be able to fetch HTML from senado.cl', async () => {
      const { WebScraper } = await import('@open-data-motivation/extractors-core');

      const scraper = new WebScraper('test-scraper', {
        baseUrl: 'https://www.senado.cl',
        timeout: 10000,
        rateLimit: {
          requests: 1,
          period: 2000,
        },
      });

      try {
        const $ = await scraper.fetchHtml('/');

        expect($).toBeDefined();
        expect(typeof $).toBe('function');
        expect($('title').length).toBeGreaterThan(0);

        const title = $('title').text();
        expect(title).toContain('Senado');

      } catch (error) {
        if (error instanceof Error && (
          error.message.includes('ENOTFOUND') ||
          error.message.includes('timeout') ||
          error.message.includes('ECONNREFUSED')
        )) {
          console.warn('Skipping web scraper test due to network issues:', error.message);
          return;
        }
        throw error;
      }
    }, NETWORK_TIMEOUT);
  });
});
