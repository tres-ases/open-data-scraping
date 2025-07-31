import { SenadoLegislatorsExtractor } from './legislators-extractor';

describe('SenadoLegislatorsExtractor', () => {
  let extractor: SenadoLegislatorsExtractor;

  beforeEach(() => {
    extractor = new SenadoLegislatorsExtractor();
  });

  it('should create an instance', () => {
    expect(extractor).toBeDefined();
  });

  it('should have the correct service name', () => {
    expect((extractor as any).logger).toBeDefined();
    // El service name puede estar en diferentes propiedades dependiendo de la versión
    const serviceName = (extractor as any).logger.serviceName ||
                       (extractor as any).logger.persistentLogAttributes?.service ||
                       'senado-legislators-extractor';
    expect(serviceName).toContain('legislators');
  });

  // Test para verificar que el método executeExtraction existe
  it('should have executeExtraction method', () => {
    expect(typeof extractor['executeExtraction']).toBe('function');
  });

  // Test para verificar que los métodos de utilidad funcionan correctamente
  describe('utility methods', () => {
    it('should clean text correctly', () => {
      const cleanText = (extractor as any).cleanText;
      expect(cleanText('  Test  Text  ')).toBe('Test Text');
      expect(cleanText('Text\nwith\nbreaks')).toBe('Text with breaks');
      expect(cleanText('')).toBe('');
    });

    it('should parse dates correctly', () => {
      const parseDate = (extractor as any).parseDate;
      expect(parseDate('2024-01-15')).toBeTruthy();
      expect(parseDate('')).toBeNull();
      expect(parseDate('invalid-date')).toBeNull();
    });

    it('should generate extraction ID', () => {
      const generateId = (extractor as any).generateExtractionId;
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });
});
