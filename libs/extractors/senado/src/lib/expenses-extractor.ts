import { z } from 'zod';
import {
  BaseDataExtractor,
  BaseExtractorInput,
  ExtractionResult
} from '@open-data-motivation/extractors-core';
import { WebScraper } from '@open-data-motivation/extractors-core';
import { ExpenseSchema, toISOString } from '@open-data-motivation/shared';
import * as cheerio from 'cheerio';

// Senate expense specific schema
const SenadoExpenseSchema = ExpenseSchema.extend({
  // Senate-specific fields
  numeroFactura: z.string().optional(),
  proveedor: z.string().optional(),
  centroCosto: z.string().optional(),
  codigoPresupuestario: z.string().optional(),
});

type SenadoExpense = z.infer<typeof SenadoExpenseSchema>;

/**
 * Extractor for Senate expenses data
 */
export class SenadoExpensesExtractor extends BaseDataExtractor {
  private scraper: WebScraper;

  constructor() {
    super('senado-expenses-extractor');
    this.scraper = new WebScraper('senado-expenses', {
      userAgent: 'OpenDataMotivation/1.0 (Senate Expenses Extractor)',
      rateLimit: {
        requests: 3, // More conservative for financial data
        period: 1000,
      },
    });
  }

  /**
   * Execute extraction of Senate expenses (implements abstract method)
   */
  protected async executeExtraction(input: BaseExtractorInput): Promise<ExtractionResult> {
    const startTime = Date.now();

    this.logger.info('Starting Senate expenses extraction', {
      dateRange: input.dateRange,
    });

    try {
      // Extract recent expenses
      const recentExpenses = await this.extractRecentExpenses(input.dateRange);

      // Extract detailed information for each expense
      const detailedExpenses = await this.extractDetailedExpenseInfo(recentExpenses);

      // Validate and clean data
      const validatedExpenses = this.validateAndCleanData(detailedExpenses);

      const processingTime = Date.now() - startTime;

      // Store data in batches
      const extractionId = this.generateExtractionId();
      let recordsStored = 0;
      let s3Location = '';

      if (validatedExpenses.length > 0) {
        const batch = {
          source: 'senado',
          dataType: 'expenses',
          timestamp: new Date().toISOString(),
          records: validatedExpenses,
          metadata: {
            extractionId,
            batchNumber: 1,
            totalBatches: 1,
            url: '/gastos',
            userAgent: 'OpenDataMotivation/1.0 (Senate Expenses Extractor)',
          },
        };

        s3Location = await this.storeRawData(batch);
        recordsStored = validatedExpenses.length;
      }

      const result: ExtractionResult = {
        success: true,
        recordsExtracted: validatedExpenses.length,
        recordsStored,
        s3Location,
        errors: [],
        processingTime,
      };

      // Store extraction metadata
      await this.storeExtractionMetadata(extractionId, input, result);

      return result;

    } catch (error) {
      this.logger.error('Failed to extract Senate expenses', { error });
      throw error;
    }
  }

  /**
   * Extract list of recent expenses
   */
  private async extractRecentExpenses(dateRange?: { start?: string; end?: string }): Promise<(Partial<SenadoExpense> & { detailUrl?: string })[]> {
    const expensesListUrl = '/transparencia/gastos-senadores';

    this.logger.debug('Extracting recent expenses list');

    const $ = await this.scraper.fetchHtml(expensesListUrl);

    const selectors = {
      container: '.gasto-item, .expense-card, .gasto-card, tr',
      senador: '.senador, .senator-name, .nombre',
      fecha: '.fecha-gasto, .expense-date, .fecha',
      concepto: '.concepto, .concept, .descripcion',
      categoria: '.categoria, .category, .tipo-gasto',
      monto: '.monto, .amount, .valor',
      moneda: '.moneda, .currency',
      proveedor: '.proveedor, .provider, .empresa',
      numeroFactura: '.factura, .invoice, .numero-factura',
      detailUrl: 'a@href',
    };

    const expenses = this.scraper.extractFromHtml($, selectors);

    this.logger.info('Extracted expenses list', { count: expenses.length });

    // Filter by date range if provided
    const filteredExpenses = this.filterExpensesByDateRange(expenses, dateRange);

    return filteredExpenses.map(expense => ({
      idLegislador: this.generateSenatorId(expense.senador),
      nombreLegislador: WebScraper.cleanText(expense.senador || ''),
      fechaGasto: this.parseExpenseDate(expense.fecha),
      concepto: WebScraper.cleanText(expense.concepto || ''),
      categoria: this.normalizeExpenseCategory(expense.categoria),
      monto: this.parseAmount(expense.monto),
      moneda: this.normalizeMoneda(expense.moneda),
      proveedor: WebScraper.cleanText(expense.proveedor || ''),
      numeroFactura: WebScraper.cleanText(expense.numeroFactura || ''),
      detailUrl: expense.detailUrl,
      camara: 'senado' as const,
    }));
  }

  /**
   * Filter expenses by date range
   */
  private filterExpensesByDateRange(
    expenses: any[],
    dateRange?: { start?: string; end?: string }
  ): any[] {
    if (!dateRange || (!dateRange.start && !dateRange.end)) {
      return expenses;
    }

    const startDate = dateRange.start ? new Date(dateRange.start) : null;
    const endDate = dateRange.end ? new Date(dateRange.end) : null;

    return expenses.filter(expense => {
      const expenseDate = WebScraper.parseChileanDate(expense.fecha);
      if (!expenseDate) return true; // Include if we can't parse the date

      if (startDate && expenseDate < startDate) return false;
      if (endDate && expenseDate > endDate) return false;

      return true;
    });
  }

  /**
   * Extract detailed information for each expense
   */
  private async extractDetailedExpenseInfo(
    expenses: (Partial<SenadoExpense> & { detailUrl?: string })[]
  ): Promise<Partial<SenadoExpense>[]> {
    const detailedExpenses: Partial<SenadoExpense>[] = [];

    this.logger.info('Extracting detailed expense information', { count: expenses.length });

    for (const [index, expense] of expenses.entries()) {
      try {
        this.logger.debug('Extracting details for expense', {
          index: index + 1,
          total: expenses.length,
          senator: expense.nombreLegislador,
          amount: expense.monto,
        });

        let detailedInfo: Partial<SenadoExpense> = {};

        if (expense.detailUrl) {
          detailedInfo = await this.extractExpenseDetail(expense.detailUrl);
        }

        detailedExpenses.push({
          ...expense,
          ...detailedInfo,
        });

        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        this.logger.error('Failed to extract expense details', {
          expense: expense.concepto,
          error: error instanceof Error ? error.message : String(error),
        });

        // Add expense with basic info even if detailed extraction fails
        detailedExpenses.push(expense);
      }
    }

    return detailedExpenses;
  }

  /**
   * Extract detailed information from expense detail page
   */
  private async extractExpenseDetail(detailUrl: string): Promise<Partial<SenadoExpense>> {
    const $ = await this.scraper.fetchHtml(detailUrl);

    const detail: Partial<SenadoExpense> = {};

    try {
      // Additional expense details
      detail.descripcionDetallada = this.extractText($, '.descripcion-detallada, .detailed-description');
      detail.centroCosto = this.extractText($, '.centro-costo, .cost-center');
      detail.codigoPresupuestario = this.extractText($, '.codigo-presupuestario, .budget-code');

      // Approval information
      detail.fechaAprobacion = this.parseDate(
        this.extractText($, '.fecha-aprobacion, .approval-date')
      ) || undefined;

      detail.aprobadoPor = this.extractText($, '.aprobado-por, .approved-by');

      // Additional financial details
      const impuestos = this.parseAmount(this.extractText($, '.impuestos, .taxes, .iva'));
      if (impuestos) {
        detail.impuestos = impuestos;
      }

      const montoNeto = this.parseAmount(this.extractText($, '.monto-neto, .net-amount'));
      if (montoNeto) {
        detail.montoNeto = montoNeto;
      }

      // Document references
      const documentoRespaldo = this.extractText($, 'a[href*="documento"]@href, a[href*="respaldo"]@href');
      if (documentoRespaldo) {
        detail.documentoRespaldo = documentoRespaldo;
      }

    } catch (error) {
      this.logger.warn('Error extracting some expense details', {
        detailUrl,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return detail;
  }

  /**
   * Helper methods
   */
  private extractText($: cheerio.CheerioAPI, selectors: string): string {
    const selectorList = selectors.split(', ');

    for (const selector of selectorList) {
      const isAttribute = selector.includes('@');
      const [cssSelector, attribute] = selector.split('@');

      const element = $(cssSelector.trim()).first();
      if (element.length > 0) {
        const text = isAttribute
          ? element.attr(attribute) || ''
          : element.text();

        const cleanedText = WebScraper.cleanText(text);
        if (cleanedText) {
          return cleanedText;
        }
      }
    }

    return '';
  }

  private parseExpenseDate(dateStr: string): string {
    if (!dateStr) return toISOString(new Date());

    const parsed = WebScraper.parseChileanDate(dateStr);
    return parsed ? toISOString(parsed) : toISOString(new Date());
  }

  protected override parseDate(dateStr: string): string | null {
    if (!dateStr) return null;

    const parsed = WebScraper.parseChileanDate(dateStr);
    return parsed ? toISOString(parsed) : null;
  }

  private parseAmount(amountStr: string): number | undefined {
    if (!amountStr) return undefined;

    // Clean the amount string
    const cleanAmount = WebScraper.cleanText(amountStr)
      .replace(/[^\d,.-]/g, '') // Remove non-numeric characters except comma, dot, and minus
      .replace(/\./g, '') // Remove thousands separators (dots)
      .replace(/,/g, '.'); // Replace comma decimal separator with dot

    const amount = parseFloat(cleanAmount);
    return isNaN(amount) ? undefined : Math.abs(amount); // Ensure positive amount
  }

  private normalizeExpenseCategory(categoria: string): string {
    if (!categoria) return 'otros';

    const cleanCategory = WebScraper.cleanText(categoria).toLowerCase();

    // Map common expense categories
    if (cleanCategory.includes('viaje') || cleanCategory.includes('traslado')) return 'viajes';
    if (cleanCategory.includes('alojamiento') || cleanCategory.includes('hotel')) return 'alojamiento';
    if (cleanCategory.includes('alimentación') || cleanCategory.includes('comida')) return 'alimentacion';
    if (cleanCategory.includes('combustible') || cleanCategory.includes('bencina')) return 'combustible';
    if (cleanCategory.includes('oficina') || cleanCategory.includes('material')) return 'oficina';
    if (cleanCategory.includes('comunicación') || cleanCategory.includes('teléfono')) return 'comunicaciones';
    if (cleanCategory.includes('representación') || cleanCategory.includes('protocolo')) return 'representacion';
    if (cleanCategory.includes('asesoría') || cleanCategory.includes('consultoría')) return 'asesoria';
    if (cleanCategory.includes('capacitación') || cleanCategory.includes('formación')) return 'capacitacion';

    return 'otros';
  }

  private normalizeMoneda(moneda: string): string {
    if (!moneda) return 'CLP';

    const cleanCurrency = WebScraper.cleanText(moneda).toUpperCase();

    if (cleanCurrency.includes('USD') || cleanCurrency.includes('DÓLAR')) return 'USD';
    if (cleanCurrency.includes('EUR') || cleanCurrency.includes('EURO')) return 'EUR';
    if (cleanCurrency.includes('UF')) return 'UF';

    return 'CLP'; // Default to Chilean Peso
  }

  private generateSenatorId(name: string): string {
    if (!name) return 'unknown-senator';

    return `senado-${name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)}`;
  }

  /**
   * Validate and clean extracted data
   */
  private validateAndCleanData(expenses: Partial<SenadoExpense>[]): Record<string, any>[] {
    const validatedExpenses: Record<string, any>[] = [];

    for (const expense of expenses) {
      try {
        // Generate ID if not present
        if (!expense.id && expense.idLegislador && expense.fechaGasto) {
          expense.id = `senado-expense-${expense.idLegislador}-${expense.fechaGasto.split('T')[0]}-${Date.now()}`;
        }

        // Set required fields with defaults
        const expenseData = {
          ...expense,
          camara: 'senado',
          fechaGasto: expense.fechaGasto || toISOString(new Date()),
          moneda: expense.moneda || 'CLP',
          categoria: expense.categoria || 'otros',
        };

        // Validate against schema (partial validation)
        const validatedExpense = SenadoExpenseSchema.partial().parse(expenseData);
        validatedExpenses.push(validatedExpense);

      } catch (error) {
        this.logger.warn('Failed to validate expense data', {
          expense: expense.concepto,
          error: error instanceof Error ? error.message : String(error),
        });

        // Add with minimal required fields
        if (expense.monto && expense.concepto) {
          validatedExpenses.push({
            id: `senado-expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            idLegislador: expense.idLegislador || 'unknown-senator',
            nombreLegislador: expense.nombreLegislador || 'Sin información',
            fechaGasto: expense.fechaGasto || toISOString(new Date()),
            concepto: expense.concepto,
            monto: expense.monto,
            moneda: expense.moneda || 'CLP',
            categoria: expense.categoria || 'otros',
            camara: 'senado',
          });
        }
      }
    }

    this.logger.info('Expense data validation completed', {
      totalExpenses: expenses.length,
      validatedExpenses: validatedExpenses.length,
    });

    return validatedExpenses;
  }
}
