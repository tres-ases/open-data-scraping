import { z } from 'zod';
import {
  BaseDataExtractor,
  BaseExtractorInput,
  ExtractionResult
} from '@open-data-motivation/extractors-core';
import { WebScraper } from '@open-data-motivation/extractors-core';
import { SessionSchema, toISOString } from '@open-data-motivation/shared';
import * as cheerio from 'cheerio';

// Senate session specific schema
const SenadoSessionSchema = SessionSchema.extend({
  // Senate-specific fields
  numeroLegislatura: z.number().optional(),
  numeroSesionLegislatura: z.number().optional(),
  actaSesion: z.object({
    url: z.string().url().optional(),
    disponible: z.boolean(),
  }).optional(),
  transmisionVideo: z.object({
    url: z.string().url().optional(),
    disponible: z.boolean(),
  }).optional(),
});

type SenadoSession = z.infer<typeof SenadoSessionSchema>;

/**
 * Extractor for Senate sessions data
 */
export class SenadoSessionsExtractor extends BaseDataExtractor {
  private scraper: WebScraper;

  constructor() {
    super('senado-sessions-extractor');
    this.scraper = new WebScraper('senado-sessions', {
      userAgent: 'OpenDataMotivation/1.0 (Senate Sessions Extractor)',
      rateLimit: {
        requests: 5,
        period: 1000,
      },
    });
  }

  /**
   * Execute extraction of Senate sessions (implements abstract method)
   */
  protected async executeExtraction(input: BaseExtractorInput): Promise<ExtractionResult> {
    const startTime = Date.now();

    this.logger.info('Starting Senate sessions extraction', {
      dateRange: input.dateRange,
    });

    try {
      // Extract recent sessions
      const recentSessions = await this.extractRecentSessions(input.dateRange);

      // Extract detailed information for each session
      const detailedSessions = await this.extractDetailedSessionInfo(recentSessions);

      // Validate and clean data
      const validatedSessions = this.validateAndCleanData(detailedSessions);

      const processingTime = Date.now() - startTime;

      // Store data in batches
      const extractionId = this.generateExtractionId();
      let recordsStored = 0;
      let s3Location = '';

      if (validatedSessions.length > 0) {
        const batch = {
          source: 'senado',
          dataType: 'sessions',
          timestamp: new Date().toISOString(),
          records: validatedSessions,
          metadata: {
            extractionId,
            batchNumber: 1,
            totalBatches: 1,
            url: '/sesiones',
            userAgent: 'OpenDataMotivation/1.0 (Senate Sessions Extractor)',
          },
        };

        s3Location = await this.storeRawData(batch);
        recordsStored = validatedSessions.length;
      }

      const result: ExtractionResult = {
        success: true,
        recordsExtracted: validatedSessions.length,
        recordsStored,
        s3Location,
        errors: [],
        processingTime,
      };

      // Store extraction metadata
      await this.storeExtractionMetadata(extractionId, input, result);

      return result;

    } catch (error) {
      this.logger.error('Failed to extract Senate sessions', { error });
      throw error;
    }
  }

  /**
   * Extract list of recent sessions
   */
  private async extractRecentSessions(dateRange?: { start?: string; end?: string }): Promise<(Partial<SenadoSession> & { detailUrl?: string; estado?: string })[]> {
    const sessionsListUrl = '/sesiones/sesiones-de-sala';

    this.logger.debug('Extracting recent sessions list');

    const $ = await this.scraper.fetchHtml(sessionsListUrl);

    const selectors = {
      container: '.sesion-item, .session-card, .sesion-card, tr',
      numeroSesion: '.numero-sesion, .session-number, .numero',
      fecha: '.fecha-sesion, .session-date, .fecha',
      tipo: '.tipo-sesion, .session-type, .tipo',
      estado: '.estado-sesion, .session-status, .estado',
      horaInicio: '.hora-inicio, .start-time',
      horaFin: '.hora-fin, .end-time',
      detailUrl: 'a@href',
      actaUrl: 'a[href*="acta"]@href',
      videoUrl: 'a[href*="video"]@href, a[href*="transmision"]@href',
    };

    const sessions = this.scraper.extractFromHtml($, selectors);

    this.logger.info('Extracted sessions list', { count: sessions.length });

    // Filter by date range if provided
    const filteredSessions = this.filterSessionsByDateRange(sessions, dateRange);

    return filteredSessions.map(session => ({
      numeroSesion: this.parseNumber(session.numeroSesion),
      fechaSesion: this.parseSessionDate(session.fecha),
      tipoSesion: this.normalizeSessionType(session.tipo),
      estado: WebScraper.cleanText(session.estado || ''),
      horaInicio: this.parseSessionTime(session.fecha, session.horaInicio),
      horaFin: this.parseSessionTime(session.fecha, session.horaFin),
      detailUrl: session.detailUrl,
      actaSesion: session.actaUrl ? {
        url: session.actaUrl,
        disponible: true,
      } : undefined,
      transmisionVideo: session.videoUrl ? {
        url: session.videoUrl,
        disponible: true,
      } : undefined,
      camara: 'senado' as const,
    }));
  }

  /**
   * Filter sessions by date range
   */
  private filterSessionsByDateRange(
    sessions: any[],
    dateRange?: { start?: string; end?: string }
  ): any[] {
    if (!dateRange || (!dateRange.start && !dateRange.end)) {
      return sessions;
    }

    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;

    return sessions.filter(session => {
      const sessionDate = WebScraper.parseChileanDate(session.fecha);
      if (!sessionDate) return true; // Include if we can't parse the date

      if (startDate && sessionDate < startDate) return false;
      if (endDate && sessionDate > endDate) return false;

      return true;
    });
  }

  /**
   * Extract detailed information for each session
   */
  private async extractDetailedSessionInfo(
    sessions: (Partial<SenadoSession> & { detailUrl?: string; estado?: string })[]
  ): Promise<Partial<SenadoSession>[]> {
    const detailedSessions: Partial<SenadoSession>[] = [];

    this.logger.info('Extracting detailed session information', { count: sessions.length });

    for (const [index, session] of sessions.entries()) {
      try {
        this.logger.debug('Extracting details for session', {
          index: index + 1,
          total: sessions.length,
          sessionNumber: session.numeroSesion,
          date: session.fechaSesion,
        });

        let detailedInfo: Partial<SenadoSession> = {};

        if (session.detailUrl) {
          detailedInfo = await this.extractSessionDetail(session.detailUrl);
        }

        detailedSessions.push({
          ...session,
          ...detailedInfo,
        });

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        this.logger.error('Failed to extract session details', {
          session: session.numeroSesion,
          error: error instanceof Error ? error.message : String(error),
        });

        // Add session with basic info even if detailed extraction fails
        detailedSessions.push(session);
      }
    }

    return detailedSessions;
  }

  /**
   * Extract detailed information from session detail page
   */
  private async extractSessionDetail(detailUrl: string): Promise<Partial<SenadoSession>> {
    const $ = await this.scraper.fetchHtml(detailUrl);

    const detail: Partial<SenadoSession> = {};

    try {
      // Session metadata
      detail.numeroLegislatura = this.parseNumber(
        this.extractText($, '.legislatura, .legislature-number')
      );

      detail.numeroSesionLegislatura = this.parseNumber(
        this.extractText($, '.sesion-legislatura, .legislature-session-number')
      );

      detail.periodoLegislativo = this.extractText($, '.periodo-legislativo, .legislative-period');

      // Session officials
      detail.presidenteSesion = this.extractText($, '.presidente-sesion, .session-president');
      detail.secretario = this.extractText($, '.secretario, .secretary');

      // Quorum information
      detail.quorumApertura = this.parseNumber(
        this.extractText($, '.quorum-apertura, .opening-quorum')
      );

      detail.quorumCierre = this.parseNumber(
        this.extractText($, '.quorum-cierre, .closing-quorum')
      );

      // Order of the day
      const ordenDia = this.extractOrdenDia($);
      if (ordenDia.length > 0) {
        detail.ordenDia = ordenDia;
      }

      // Attendance
      const asistencia = this.extractAttendance($);
      if (asistencia.length > 0) {
        detail.asistencia = asistencia;
      }

    } catch (error) {
      this.logger.warn('Error extracting some session details', {
        detailUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return detail;
  }

  /**
   * Extract order of the day (agenda)
   */
  private extractOrdenDia($: cheerio.CheerioAPI): any[] {
    const items: any[] = [];

    $('.orden-dia-item, .agenda-item, .orden-item').each((index, element) => {
      const $element = $(element);

      const numero = this.parseNumber($element.find('.numero, .number').text());
      const boletin = WebScraper.cleanText($element.find('.boletin, .bulletin').text());
      const titulo = WebScraper.cleanText($element.find('.titulo, .title, h3, h4').text());
      const tipoTramite = WebScraper.cleanText($element.find('.tramite, .procedure').text());
      const urgencia = WebScraper.cleanText($element.find('.urgencia, .urgency').text());

      if (titulo || boletin) {
        items.push({
          numero: numero || index + 1,
          boletin: boletin || '',
          titulo: titulo || '',
          tipoTramite: tipoTramite || '',
          urgencia: urgencia || undefined,
        });
      }
    });

    return items;
  }

  /**
   * Extract attendance information
   */
  private extractAttendance($: cheerio.CheerioAPI): any[] {
    const attendance: any[] = [];

    $('.asistencia-item, .attendance-item, .senador-asistencia').each((_, element) => {
      const $element = $(element);

      const nombre = WebScraper.cleanText($element.find('.nombre, .name').text());
      const presente = this.parseAttendanceStatus($element.find('.estado, .status').text());
      const horaLlegada = WebScraper.cleanText($element.find('.hora-llegada, .arrival-time').text());
      const horaSalida = WebScraper.cleanText($element.find('.hora-salida, .departure-time').text());
      const justificacion = WebScraper.cleanText($element.find('.justificacion, .justification').text());

      if (nombre) {
        attendance.push({
          idLegislador: this.generateSenatorId(nombre),
          nombre,
          presente,
          horaLlegada: horaLlegada ? this.parseTime(horaLlegada) : undefined,
          horaSalida: horaSalida ? this.parseTime(horaSalida) : undefined,
          justificacionAusencia: justificacion || undefined,
          tipoAusencia: presente ? undefined : this.classifyAbsenceType(justificacion),
        });
      }
    });

    return attendance;
  }

  /**
   * Helper methods
   */
  private extractText($: cheerio.CheerioAPI, selectors: string): string {
    const selectorList = selectors.split(', ');

    for (const selector of selectorList) {
      const element = $(selector.trim()).first();
      if (element.length > 0) {
        const text = WebScraper.cleanText(element.text());
        if (text) return text;
      }
    }

    return '';
  }

  private parseNumber(text: string): number | undefined {
    if (!text) return undefined;
    const num = parseInt(WebScraper.cleanText(text), 10);
    return isNaN(num) ? undefined : num;
  }

  private parseSessionDate(dateStr: string): string {
    if (!dateStr) return toISOString(new Date());

    const parsed = WebScraper.parseChileanDate(dateStr);
    return parsed ? toISOString(parsed) : toISOString(new Date());
  }

  private parseSessionTime(dateStr: string, timeStr: string): string | undefined {
    if (!dateStr || !timeStr) return undefined;

    const date = WebScraper.parseChileanDate(dateStr);
    if (!date) return undefined;

    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return undefined;

    const [, hours, minutes] = timeMatch;
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    return toISOString(date);
  }

  private normalizeSessionType(tipo: string): 'ordinaria' | 'extraordinaria' {
    if (!tipo) return 'ordinaria';

    const cleanType = WebScraper.cleanText(tipo).toLowerCase();

    if (cleanType.includes('extraordinaria')) return 'extraordinaria';

    return 'ordinaria';
  }

  private parseAttendanceStatus(statusText: string): boolean {
    if (!statusText) return false;

    const cleanStatus = WebScraper.cleanText(statusText).toLowerCase();

    return cleanStatus.includes('presente') ||
      cleanStatus.includes('asiste') ||
      cleanStatus.includes('sí');
  }

  private parseTime(timeStr: string): string | undefined {
    if (!timeStr) return undefined;

    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return undefined;

    const [, hours, minutes] = timeMatch;
    const today = new Date();
    today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

    return toISOString(today);
  }

  private classifyAbsenceType(justification?: string): string | undefined {
    if (!justification) return 'sin_justificar';

    const cleanJustification = WebScraper.cleanText(justification).toLowerCase();

    if (cleanJustification.includes('enfermedad') || cleanJustification.includes('salud')) {
      return 'enfermedad';
    }
    if (cleanJustification.includes('viaje') || cleanJustification.includes('comisión')) {
      return 'comision_servicio';
    }
    if (cleanJustification.includes('personal') || cleanJustification.includes('familiar')) {
      return 'personal';
    }

    return 'justificada';
  }

  private generateSenatorId(name: string): string {
    return `senado-${name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)}`;
  }

  /**
   * Validate and clean extracted data
   */
  private validateAndCleanData(sessions: Partial<SenadoSession>[]): Record<string, any>[] {
    const validatedSessions: Record<string, any>[] = [];

    for (const session of sessions) {
      try {
        // Generate ID if not present
        if (!session.id && session.numeroSesion && session.fechaSesion) {
          session.id = `senado-session-${session.numeroSesion}-${session.fechaSesion.split('T')[0]}`;
        }

        // Set required fields with defaults
        const sessionData = {
          ...session,
          camara: 'senado',
          estado: (session as any).estado || 'completada',
          fechaSesion: session.fechaSesion || toISOString(new Date()),
        };

        // Validate against schema (partial validation)
        const validatedSession = SenadoSessionSchema.partial().parse(sessionData);
        validatedSessions.push(validatedSession);

      } catch (error) {
        this.logger.warn('Failed to validate session data', {
          session: session.numeroSesion,
          error: error instanceof Error ? error.message : String(error),
        });

        // Add with minimal required fields
        if (session.numeroSesion || session.fechaSesion) {
          validatedSessions.push({
            id: `senado-session-${session.numeroSesion || 'unknown'}-${Date.now()}`,
            numeroSesion: session.numeroSesion || 0,
            fechaSesion: session.fechaSesion || toISOString(new Date()),
            camara: 'senado',
            estado: 'completada',
            tipoSesion: session.tipoSesion || 'ordinaria',
          });
        }
      }
    }

    this.logger.info('Session data validation completed', {
      totalSessions: sessions.length,
      validatedSessions: validatedSessions.length,
    });

    return validatedSessions;
  }
}
