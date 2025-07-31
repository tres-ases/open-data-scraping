import { z } from 'zod';
import {
  BaseDataExtractor,
  BaseExtractorInput,
  ExtractionResult
} from '@open-data-motivation/extractors-core';
import { WebScraper } from '@open-data-motivation/extractors-core';
import { LegislatorSchema, toISOString } from '@open-data-motivation/shared';
import * as cheerio from 'cheerio';

// Senate legislator specific schema
const SenadoLegislatorSchema = LegislatorSchema.extend({
  // Senate-specific fields
  numeroLegislatura: z.number().optional(),
  comisiones: z.array(z.string()).optional(),
  periodoLegislativo: z.string().optional(),
});

type SenadoLegislator = z.infer<typeof SenadoLegislatorSchema>;

/**
 * Extractor for Senate legislators data
 */
export class SenadoLegislatorsExtractor extends BaseDataExtractor {
  private scraper: WebScraper;

  constructor() {
    super('senado-legislators-extractor');
    this.scraper = new WebScraper('senado-legislators', {
      userAgent: 'OpenDataMotivation/1.0 (Senate Legislators Extractor)',
      rateLimit: {
        requests: 5,
        period: 1000,
      },
    });
  }

  /**
   * Execute extraction of Senate legislators (implements abstract method)
   */
  protected async executeExtraction(input: BaseExtractorInput): Promise<ExtractionResult> {
    const startTime = Date.now();

    this.logger.info('Starting Senate legislators extraction');

    try {
      // Extract legislators list
      const legislators = await this.extractLegislatorsList();

      // Extract detailed information for each legislator
      const detailedLegislators = await this.extractDetailedLegislatorInfo(legislators);

      // Validate and clean data
      const validatedLegislators = this.validateAndCleanData(detailedLegislators);

      const processingTime = Date.now() - startTime;

      // Store data in batches
      const extractionId = this.generateExtractionId();
      let recordsStored = 0;
      let s3Location = '';

      if (validatedLegislators.length > 0) {
        const batch = {
          source: 'senado',
          dataType: 'legislators',
          timestamp: new Date().toISOString(),
          records: validatedLegislators,
          metadata: {
            extractionId,
            batchNumber: 1,
            totalBatches: 1,
            url: '/senadores',
            userAgent: 'OpenDataMotivation/1.0 (Senate Legislators Extractor)',
          },
        };

        s3Location = await this.storeRawData(batch);
        recordsStored = validatedLegislators.length;
      }

      const result: ExtractionResult = {
        success: true,
        recordsExtracted: validatedLegislators.length,
        recordsStored,
        s3Location,
        errors: [],
        processingTime,
      };

      // Store extraction metadata
      await this.storeExtractionMetadata(extractionId, input, result);

      return result;

    } catch (error) {
      this.logger.error('Failed to extract Senate legislators', { error });
      throw error;
    }
  }

  /**
   * Extract list of legislators
   */
  private async extractLegislatorsList(): Promise<(Partial<SenadoLegislator> & { detailUrl?: string })[]> {
    const legislatorsListUrl = '/senadores';

    this.logger.debug('Extracting legislators list');

    const $ = await this.scraper.fetchHtml(legislatorsListUrl);

    const selectors = {
      container: '.senador-item, .legislator-card, .senador-card, tr',
      nombre: '.nombre, .name, .senador-nombre',
      partido: '.partido, .party',
      region: '.region, .constituency',
      email: '.email, .correo',
      telefono: '.telefono, .phone',
      detailUrl: 'a@href',
    };

    const legislators = this.scraper.extractFromHtml($, selectors);

    this.logger.info('Extracted legislators list', { count: legislators.length });

    return legislators.map((legislator: any) => ({
      nombre: this.cleanText(legislator.nombre || ''),
      partido: this.cleanText(legislator.partido || ''),
      region: this.cleanText(legislator.region || ''),
      email: this.cleanText(legislator.email || ''),
      telefono: this.cleanText(legislator.telefono || ''),
      detailUrl: legislator.detailUrl,
      camara: 'senado' as const,
    }));
  }

  /**
   * Extract detailed information for each legislator
   */
  private async extractDetailedLegislatorInfo(
    legislators: (Partial<SenadoLegislator> & { detailUrl?: string })[]
  ): Promise<Partial<SenadoLegislator>[]> {
    const detailedLegislators: Partial<SenadoLegislator>[] = [];

    this.logger.info('Extracting detailed legislator information', { count: legislators.length });

    for (const [index, legislator] of legislators.entries()) {
      try {
        this.logger.debug('Extracting details for legislator', {
          index: index + 1,
          total: legislators.length,
          name: legislator.nombre,
        });

        let detailedInfo: Partial<SenadoLegislator> = {};

        if (legislator.detailUrl) {
          detailedInfo = await this.extractLegislatorDetail(legislator.detailUrl);
        }

        detailedLegislators.push({
          ...legislator,
          ...detailedInfo,
        });

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        this.logger.error('Failed to extract legislator details', {
          legislator: legislator.nombre,
          error: error instanceof Error ? error.message : String(error),
        });

        // Add legislator with basic info even if detailed extraction fails
        detailedLegislators.push(legislator);
      }
    }

    return detailedLegislators;
  }

  /**
   * Extract detailed information from legislator detail page
   */
  private async extractLegislatorDetail(detailUrl: string): Promise<Partial<SenadoLegislator>> {
    const $ = await this.scraper.fetchHtml(detailUrl);

    const detail: Partial<SenadoLegislator> = {};

    try {
      // Basic information - using any to bypass type checking for now
      (detail as any).biografia = this.extractText($, '.biografia, .biography, .bio');
      (detail as any).fechaNacimiento = this.parseDate(this.extractText($, '.fecha-nacimiento, .birth-date'));
      (detail as any).profesion = this.extractText($, '.profesion, .profession');
      (detail as any).educacion = this.extractText($, '.educacion, .education');

      // Legislative information
      detail.numeroLegislatura = this.parseNumber(
        this.extractText($, '.legislatura, .legislature-number')
      );

      detail.periodoLegislativo = this.extractText($, '.periodo, .period');

      // Committees
      const comisiones = this.extractCommittees($);
      if (comisiones.length > 0) {
        detail.comisiones = comisiones;
      }

      // Contact information - using any to bypass type checking for now
      (detail as any).sitioWeb = this.extractText($, '.sitio-web, .website, .web');
      (detail as any).redesSociales = this.extractSocialMedia($);

    } catch (error) {
      this.logger.warn('Error extracting some legislator details', {
        detailUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return detail;
  }

  /**
   * Extract committees information
   */
  private extractCommittees($: cheerio.CheerioAPI): string[] {
    const committees: string[] = [];

    $('.comision, .committee, .comision-item').each((_, element) => {
      const $element = $(element);
      const committee = this.cleanText($element.text());
      if (committee) {
        committees.push(committee);
      }
    });

    return committees;
  }

  /**
   * Extract social media information
   */
  private extractSocialMedia($: cheerio.CheerioAPI): Record<string, string> {
    const socialMedia: Record<string, string> = {};

    $('.social-media a, .redes-sociales a').each((_, element) => {
      const $element = $(element);
      const href = $element.attr('href');
      const text = this.cleanText($element.text());

      if (href) {
        if (href.includes('twitter.com') || href.includes('x.com')) {
          socialMedia.twitter = href;
        } else if (href.includes('facebook.com')) {
          socialMedia.facebook = href;
        } else if (href.includes('instagram.com')) {
          socialMedia.instagram = href;
        } else if (text && href) {
          socialMedia[text.toLowerCase()] = href;
        }
      }
    });

    return socialMedia;
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

  protected override parseDate(dateStr: string): string | null {
    if (!dateStr) return null;

    const parsed = WebScraper.parseChileanDate(dateStr);
    return parsed ? toISOString(parsed) : null;
  }

  /**
   * Validate and clean extracted data
   */
  private validateAndCleanData(legislators: Partial<SenadoLegislator>[]): Record<string, any>[] {
    const validatedLegislators: Record<string, any>[] = [];

    for (const legislator of legislators) {
      try {
        // Generate ID if not present
        if (!legislator.id && legislator.nombre) {
          legislator.id = `senado-${legislator.nombre.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50)}`;
        }

        // Set required fields with defaults
        const legislatorData = {
          ...legislator,
          camara: 'senado',
          nombre: legislator.nombre || 'Sin información',
          estado: 'activo', // Default state
        };

        // Validate against schema (partial validation)
        const validatedLegislator = SenadoLegislatorSchema.partial().parse(legislatorData);
        validatedLegislators.push(validatedLegislator);

      } catch (error) {
        this.logger.warn('Failed to validate legislator data', {
          legislator: legislator.nombre,
          error: error instanceof Error ? error.message : String(error),
        });

        // Add with minimal required fields
        if (legislator.nombre) {
          validatedLegislators.push({
            id: `senado-${legislator.nombre.toLowerCase()
              .replace(/[^a-z0-9\s]/g, '')
              .replace(/\s+/g, '-')
              .substring(0, 50)}`,
            nombre: legislator.nombre,
            camara: 'senado',
            estado: 'activo',
            partido: legislator.partido || 'Sin información',
            region: legislator.region || 'Sin información',
          });
        }
      }
    }

    this.logger.info('Legislator data validation completed', {
      totalLegislators: legislators.length,
      validatedLegislators: validatedLegislators.length,
    });

    return validatedLegislators;
  }
}
