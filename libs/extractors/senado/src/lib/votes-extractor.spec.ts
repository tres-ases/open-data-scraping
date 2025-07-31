import { SenadoVotesExtractor } from './votes-extractor';

describe('SenadoVotesExtractor', () => {
  let extractor: SenadoVotesExtractor;

  beforeEach(() => {
    extractor = new SenadoVotesExtractor();
  });

  it('should create an instance', () => {
    expect(extractor).toBeDefined();
  });

  it('should have the correct service name', () => {
    expect((extractor as any).logger.serviceName).toBe('senado-votes-extractor');
  });

  describe('utility methods', () => {
    it('should normalize vote results correctly', () => {
      const normalizeResult = (extractor as any).normalizeVoteResult;

      expect(normalizeResult('Aprobado')).toBe('aprobado');
      expect(normalizeResult('APROBADA')).toBe('aprobado');
      expect(normalizeResult('Rechazado')).toBe('rechazado');
      expect(normalizeResult('RECHAZADA')).toBe('rechazado');
      expect(normalizeResult('Retirado')).toBe('retirado');
      expect(normalizeResult('RETIRADA')).toBe('retirado');
      expect(normalizeResult('')).toBe('pendiente');
      expect(normalizeResult('unknown')).toBe('pendiente');
    });

    it('should normalize vote types correctly', () => {
      const normalizeType = (extractor as any).normalizeVoteType;

      expect(normalizeType('Nominal')).toBe('nominal');
      expect(normalizeType('ECONÓMICA')).toBe('economica');
      expect(normalizeType('economica')).toBe('economica');
      expect(normalizeType('Secreta')).toBe('secreta');
      expect(normalizeType('')).toBe('nominal'); // default
      expect(normalizeType('unknown')).toBe('nominal'); // default
    });

    it('should normalize individual votes correctly', () => {
      const normalizeVote = (extractor as any).normalizeIndividualVote;

      expect(normalizeVote('A favor')).toBe('favor');
      expect(normalizeVote('Sí')).toBe('favor');
      expect(normalizeVote('SI')).toBe('favor');
      expect(normalizeVote('En contra')).toBe('contra');
      expect(normalizeVote('No')).toBe('contra');
      expect(normalizeVote('Abstención')).toBe('abstencion');
      expect(normalizeVote('Ausente')).toBe('ausente');
      expect(normalizeVote('')).toBe('ausente'); // default
    });

    it('should generate senator ID correctly', () => {
      const generateId = (extractor as any).generateSenatorId;

      expect(generateId('Juan Pérez García')).toBe('senado-juan-perez-garcia');
      expect(generateId('María José López-Mendoza')).toBe('senado-maria-jose-lopez-mendoza');
      expect(generateId('José Antonio O\'Higgins')).toBe('senado-jose-antonio-ohiggins');
    });

    it('should parse numbers correctly', () => {
      const parseNumber = (extractor as any).parseNumber;

      expect(parseNumber('123')).toBe(123);
      expect(parseNumber('  456  ')).toBe(456);
      expect(parseNumber('0')).toBe(0);
      expect(parseNumber('')).toBeUndefined();
      expect(parseNumber('abc')).toBeUndefined();
      expect(parseNumber('123abc')).toBe(123);
    });
  });
});
