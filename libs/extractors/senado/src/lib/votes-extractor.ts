import { z } from 'zod';
import {
  BaseDataExtractor,
  BaseExtractorInput,
  ExtractionResult
} from '@open-data/extractors-core';
import { WebScraper } from '@open-data/extractors-core';
import { VotationSchema, toISOString } from '@open-data/shared';
import * as cheerio from 'cheerio';

// Senate vote specific schema
const SenadoVoteSchema = VotationSchema.extend({
  // Senate-specific fields
  numeroLegislatura: z.number().optional(),
  numeroSesionLegislatura: z.number().optional(),
  tipoVotacion: z.enum(['nominal', 'economica', 'secreta']).optional(),
  articuloReglamento: z.string().optional(),
});

type SenadoVote = z.infer<typeof SenadoVoteSchema>;

/**
 * Extractor for Senate votes data
 */
export class SenadoVotesExtractor extends BaseDataExtractor {
  private scraper: WebScraper;

  constructor() {
    super('senado-votes-extractor');
    this.scraper = new WebScraper('senado-votes', {
      userAgent: 'OpenData/1.0 (Senate Votes Extractor)',
      rateLimit: {
        requests: 5,
        period: 1000,
      },
    });
  }

  /**
   * Execute extraction of Senate votes (implements abstract method)
   */
  protected async executeExtraction(input: BaseExtractorInput): Promise<ExtractionResult> {
    const startTime = Date.now();

    this.logger.info('Starting Senate votes extraction', {
      dateRange: input.dateRange,
    });

    try {
      // Extract recent votes
      const recentVotes = await this.extractRecentVotes(input.dateRange);

      // Extract detailed information for each vote
      const detailedVotes = await this.extractDetailedVoteInfo(recentVotes);

      // Validate and clean data
      const validatedVotes = this.validateAndCleanData(detailedVotes);

      const processingTime = Date.now() - startTime;

      // Store data in batches
      const extractionId = this.generateExtractionId();
      let recordsStored = 0;
      let s3Location = '';

      if (validatedVotes.length > 0) {
        const batch = {
          source: 'senado',
          dataType: 'votes',
          timestamp: new Date().toISOString(),
          records: validatedVotes,
          metadata: {
            extractionId,
            batchNumber: 1,
            totalBatches: 1,
            url: '/votaciones/votaciones-de-sala',
            userAgent: 'OpenData/1.0 (Senate Votes Extractor)',
          },
        };

        s3Location = await this.storeRawData(batch);
        recordsStored = validatedVotes.length;
      }

      const result: ExtractionResult = {
        success: true,
        recordsExtracted: validatedVotes.length,
        recordsStored,
        s3Location,
        errors: [],
        processingTime,
      };

      // Store extraction metadata
      await this.storeExtractionMetadata(extractionId, input, result);

      return result;

    } catch (error) {
      this.logger.error('Failed to extract Senate votes', { error });
      throw error;
    }
  }

  /**
   * Extract list of recent votes
   */
  private async extractRecentVotes(dateRange?: { start?: string; end?: string }): Promise<(Partial<SenadoVote> & { detailUrl?: string })[]> {
    const votesListUrl = '/votaciones/votaciones-de-sala';

    this.logger.debug('Extracting recent votes list');

    const $ = await this.scraper.fetchHtml(votesListUrl);

    const selectors = {
      container: '.votacion-item, .vote-card, .votacion-card, tr',
      numeroVotacion: '.numero-votacion, .vote-number, .numero',
      fecha: '.fecha-votacion, .vote-date, .fecha',
      sesion: '.sesion, .session-number',
      boletin: '.boletin, .bulletin',
      materia: '.materia, .subject, .titulo',
      tipoVotacion: '.tipo-votacion, .vote-type, .tipo',
      resultado: '.resultado, .result',
      detailUrl: 'a@href',
    };

    const votes = this.scraper.extractFromHtml($, selectors);

    this.logger.info('Extracted votes list', { count: votes.length });

    // Filter by date range if provided
    const filteredVotes = this.filterVotesByDateRange(votes, dateRange);

    return filteredVotes.map(vote => ({
      numeroVotacion: this.parseNumber(vote.numeroVotacion),
      fechaVotacion: this.parseVoteDate(vote.fecha),
      numeroSesion: this.parseNumber(vote.sesion),
      boletin: this.cleanText(vote.boletin || ''),
      materia: this.cleanText(vote.materia || ''),
      tipoVotacion: this.normalizeVoteType(vote.tipoVotacion),
      resultado: this.normalizeVoteResult(vote.resultado),
      detailUrl: vote.detailUrl,
      camara: 'senado' as const,
    }));
  }

  /**
   * Filter votes by date range
   */
  private filterVotesByDateRange(
    votes: any[],
    dateRange?: { start?: string; end?: string }
  ): any[] {
    if (!dateRange || (!dateRange.start && !dateRange.end)) {
      return votes;
    }

    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;

    return votes.filter(vote => {
      const voteDate = WebScraper.parseChileanDate(vote.fecha);
      if (!voteDate) return true; // Include if we can't parse the date

      if (startDate && voteDate < startDate) return false;
      if (endDate && voteDate > endDate) return false;

      return true;
    });
  }

  /**
   * Extract detailed information for each vote
   */
  private async extractDetailedVoteInfo(
    votes: (Partial<SenadoVote> & { detailUrl?: string })[]
  ): Promise<Partial<SenadoVote>[]> {
    const detailedVotes: Partial<SenadoVote>[] = [];

    this.logger.info('Extracting detailed vote information', { count: votes.length });

    for (const [index, vote] of votes.entries()) {
      try {
        this.logger.debug('Extracting details for vote', {
          index: index + 1,
          total: votes.length,
          voteNumber: vote.numeroVotacion,
          date: vote.fechaVotacion,
        });

        let detailedInfo: Partial<SenadoVote> = {};

        if (vote.detailUrl) {
          detailedInfo = await this.extractVoteDetail(vote.detailUrl);
        }

        detailedVotes.push({
          ...vote,
          ...detailedInfo,
        });

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        this.logger.error('Failed to extract vote details', {
          vote: vote.numeroVotacion,
          error: error instanceof Error ? error.message : String(error),
        });

        // Add vote with basic info even if detailed extraction fails
        detailedVotes.push(vote);
      }
    }

    return detailedVotes;
  }

  /**
   * Extract detailed information from vote detail page
   */
  private async extractVoteDetail(detailUrl: string): Promise<Partial<SenadoVote>> {
    const $ = await this.scraper.fetchHtml(detailUrl);

    const detail: Partial<SenadoVote> = {};

    try {
      // Vote metadata
      detail.numeroLegislatura = this.parseNumber(
        this.extractText($, '.legislatura, .legislature-number')
      );

      detail.numeroSesionLegislatura = this.parseNumber(
        this.extractText($, '.sesion-legislatura, .legislature-session-number')
      );

      detail.articuloReglamento = this.extractText($, '.articulo-reglamento, .regulation-article');

      // Vote details
      detail.descripcion = this.extractText($, '.descripcion, .description, .detalle');
      detail.urgencia = this.extractText($, '.urgencia, .urgency');
      detail.etapaTramitacion = this.extractText($, '.etapa, .stage, .tramitacion');

      // Vote counts
      const votesCounts = this.extractVoteCounts($);
      if (Object.keys(votesCounts).length > 0) {
        detail.votosFavor = votesCounts.favor;
        detail.votosContra = votesCounts.contra;
        detail.votosAbstenciones = votesCounts.abstenciones;
        detail.votosAusentes = votesCounts.ausentes;
      }

      // Individual votes
      const individualVotes = this.extractIndividualVotes($);
      if (individualVotes.length > 0) {
        detail.votosIndividuales = individualVotes;
      }

      // Quorum information
      detail.quorumRequerido = this.parseNumber(
        this.extractText($, '.quorum-requerido, .required-quorum')
      );

      detail.quorumObtenido = this.parseNumber(
        this.extractText($, '.quorum-obtenido, .obtained-quorum')
      );

    } catch (error) {
      this.logger.warn('Error extracting some vote details', {
        detailUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return detail;
  }

  /**
   * Extract vote counts summary
   */
  private extractVoteCounts($: cheerio.CheerioAPI): Record<string, number> {
    const counts: Record<string, number> = {};

    // Try different selectors for vote counts
    const countSelectors = [
      { key: 'favor', selectors: '.votos-favor, .votes-favor, .si, .yes' },
      { key: 'contra', selectors: '.votos-contra, .votes-against, .no' },
      { key: 'abstenciones', selectors: '.votos-abstencion, .votes-abstention, .abstenciones' },
      { key: 'ausentes', selectors: '.votos-ausentes, .votes-absent, .ausentes' },
    ];

    for (const { key, selectors } of countSelectors) {
      const count = this.parseNumber(this.extractText($, selectors));
      if (count !== undefined) {
        counts[key] = count;
      }
    }

    return counts;
  }

  /**
   * Extract individual votes
   */
  private extractIndividualVotes($: cheerio.CheerioAPI): any[] {
    const votes: any[] = [];

    $('.voto-individual, .individual-vote, .senador-voto').each((_, element) => {
      const $element = $(element);

      const nombre = this.cleanText($element.find('.nombre, .name').text());
      const voto = this.normalizeIndividualVote($element.find('.voto, .vote').text());
      const partido = this.cleanText($element.find('.partido, .party').text());
      const region = this.cleanText($element.find('.region, .constituency').text());

      if (nombre && voto) {
        votes.push({
          idLegislador: this.generateSenatorId(nombre),
          nombre,
          voto,
          partido: partido || undefined,
          region: region || undefined,
        });
      }
    });

    return votes;
  }

  /**
   * Helper methods
   */
  private extractText($: cheerio.CheerioAPI, selectors: string): string {
    const selectorList = selectors.split(', ');

    for (const selector of selectorList) {
      const element = $(selector.trim()).first();
      if (element.length > 0) {
        const text = this.cleanText(element.text());
        if (text) return text;
      }
    }

    return '';
  }



  private parseNumber(text: string): number | undefined {
    if (!text) return undefined;
    const num = parseInt(this.cleanText(text), 10);
    return isNaN(num) ? undefined : num;
  }

  private parseVoteDate(dateStr: string): string {
    if (!dateStr) return toISOString(new Date());

    const parsed = WebScraper.parseChileanDate(dateStr);
    return parsed ? toISOString(parsed) : toISOString(new Date());
  }

  private normalizeVoteType(tipo: string): 'nominal' | 'economica' | 'secreta' {
    if (!tipo) return 'nominal'; // Default for empty string

    const cleanType = this.cleanText(tipo).toLowerCase();

    if (cleanType.includes('nominal')) return 'nominal';
    if (cleanType.includes('económica') || cleanType.includes('economica')) return 'economica';
    if (cleanType.includes('secreta')) return 'secreta';

    return 'nominal'; // Default
  }

  private normalizeVoteResult(resultado: string): 'aprobado' | 'rechazado' | 'retirado' | 'pendiente' {
    if (!resultado) return 'pendiente';

    const cleanResult = this.cleanText(resultado).toLowerCase();

    if (cleanResult.includes('aprobado') || cleanResult.includes('aprobada')) return 'aprobado';
    if (cleanResult.includes('rechazado') || cleanResult.includes('rechazada')) return 'rechazado';
    if (cleanResult.includes('retirado') || cleanResult.includes('retirada')) return 'retirado';

    return 'pendiente';
  }

  private normalizeIndividualVote(voto: string): string {
    if (!voto) return 'ausente';

    const cleanVote = this.cleanText(voto).toLowerCase();

    if (cleanVote.includes('favor') || cleanVote.includes('sí') || cleanVote.includes('si')) return 'favor';
    if (cleanVote.includes('contra') || cleanVote.includes('no')) return 'contra';
    if (cleanVote.includes('abstención') || cleanVote.includes('abstencion')) return 'abstencion';
    if (cleanVote.includes('ausente') || cleanVote.includes('inasistencia')) return 'ausente';

    return 'ausente';
  }

  private generateSenatorId(name: string): string {
    return `senado-${name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Keep hyphens
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .substring(0, 50)}`;
  }

  /**
   * Validate and clean extracted data
   */
  private validateAndCleanData(votes: Partial<SenadoVote>[]): Record<string, any>[] {
    const validatedVotes: Record<string, any>[] = [];

    for (const vote of votes) {
      try {
        // Generate ID if not present
        if (!vote.id && vote.numeroVotacion && vote.fechaVotacion) {
          vote.id = `senado-vote-${vote.numeroVotacion}-${vote.fechaVotacion.split('T')[0]}`;
        }

        // Set required fields with defaults
        const voteData = {
          ...vote,
          camara: 'senado',
          fechaVotacion: vote.fechaVotacion || toISOString(new Date()),
          resultado: vote.resultado || 'pendiente',
        };

        // Validate against schema (partial validation)
        const validatedVote = SenadoVoteSchema.partial().parse(voteData);
        validatedVotes.push(validatedVote);

      } catch (error) {
        this.logger.warn('Failed to validate vote data', {
          vote: vote.numeroVotacion,
          error: error instanceof Error ? error.message : String(error),
        });

        // Add with minimal required fields
        if (vote.numeroVotacion || vote.materia) {
          validatedVotes.push({
            id: `senado-vote-${vote.numeroVotacion || 'unknown'}-${Date.now()}`,
            numeroVotacion: vote.numeroVotacion || 0,
            fechaVotacion: vote.fechaVotacion || toISOString(new Date()),
            camara: 'senado',
            materia: vote.materia || 'Sin información',
            resultado: vote.resultado || 'pendiente',
          });
        }
      }
    }

    this.logger.info('Vote data validation completed', {
      totalVotes: votes.length,
      validatedVotes: validatedVotes.length,
    });

    return validatedVotes;
  }
}
