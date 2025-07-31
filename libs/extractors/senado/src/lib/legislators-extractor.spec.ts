import { SenadoLegislatorsExtractor } from './legislators-extractor';

describe('SenadoLegislatorsExtractor', () => {
  let extractor: SenadoLegislatorsExtractor;

  beforeEach(() => {
    extractor = new SenadoLegislatorsExtractor();
  });

  it('should create an instance', () => {
    expect(extractor).toBeDefined();
  });

  it('should have logger configured', () => {
    expect((extractor as any).logger).toBeDefined();
  });

  it('should have executeExtraction method', () => {
    expect(typeof (extractor as any).executeExtraction).toBe('function');
  });

  it('should have handler method', () => {
    expect(typeof extractor.handler).toBe('function');
  });

  it('should be instance of correct class', () => {
    expect(extractor).toBeInstanceOf(SenadoLegislatorsExtractor);
  });
});
