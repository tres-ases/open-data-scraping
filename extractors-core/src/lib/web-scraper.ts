import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnit } from '@aws-lambda-powertools/metrics';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { z } from 'zod';

// Web scraping configuration
export interface ScrapingConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  userAgent: string;
  rateLimit: {
    requests: number;
    period: number; // in milliseconds
  };
}

// Default configuration
const DEFAULT_CONFIG: ScrapingConfig = {
  baseUrl: '',
  timeout: 30000,
  retryAttempts: 3,
  userAgent: 'OpenData/1.0 (Legislative Data Extractor)',
  rateLimit: {
    requests: 10,
    period: 1000, // 10 requests per second
  },
};

// Rate limiter class
class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private period: number;

  constructor(maxRequests: number, period: number) {
    this.maxRequests = maxRequests;
    this.period = period;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside the period
    this.requests = this.requests.filter(time => now - time < this.period);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.period - (now - oldestRequest);

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.requests.push(now);
  }
}

/**
 * Web scraper utility class with rate limiting and error handling
 */
export class WebScraper {
  private logger: Logger;
  private metrics: Metrics;
  private axiosInstance: AxiosInstance;
  private rateLimiter: RateLimiter;
  private config: ScrapingConfig;

  constructor(serviceName: string, config: Partial<ScrapingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.logger = new Logger({ serviceName: `${serviceName}-scraper` });
    this.metrics = new Metrics({
      namespace: 'ODM',
      serviceName: `${serviceName}-scraper`,
    });

    this.rateLimiter = new RateLimiter(
      this.config.rateLimit.requests,
      this.config.rateLimit.period
    );

    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    // Add request interceptor for rate limiting
    this.axiosInstance.interceptors.request.use(async (config) => {
      await this.rateLimiter.waitIfNeeded();
      return config;
    });

    // Add response interceptor for metrics
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.metrics.addMetric('HttpRequestSuccess', MetricUnit.Count, 1);
        return response;
      },
      (error) => {
        this.metrics.addMetric('HttpRequestError', MetricUnit.Count, 1);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Fetch HTML content from a URL
   */
  async fetchHtml(url: string, options: AxiosRequestConfig = {}): Promise<cheerio.CheerioAPI> {
    const startTime = Date.now();

    try {
      this.logger.debug('Fetching HTML', { url });

      const response = await this.axiosInstance.get(url, {
        ...options,
        responseType: 'text',
      });

      const responseTime = Date.now() - startTime;
      this.metrics.addMetric('HttpResponseTime', MetricUnit.Milliseconds, responseTime);

      this.logger.debug('HTML fetched successfully', {
        url,
        statusCode: response.status,
        contentLength: response.data.length,
        responseTime,
      });

      return cheerio.load(response.data);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.metrics.addMetric('HttpResponseTime', MetricUnit.Milliseconds, responseTime);

      this.logger.error('Failed to fetch HTML', {
        url,
        error: error instanceof Error ? error.message : String(error),
        responseTime,
      });

      throw error;
    }
  }

  /**
   * Extract data from HTML using CSS selectors
   */
  extractFromHtml<T>(
    $: cheerio.CheerioAPI,
    selectors: Record<string, string>,
    validator?: z.ZodSchema<T>
  ): T[] {
    const results: any[] = [];

    try {
      // Find the container elements (usually rows in a table or list items)
      const containerSelector = selectors.container || 'tr, li, .item';
      const containers = $(containerSelector);

      this.logger.debug('Extracting data from HTML', {
        containerSelector,
        containerCount: containers.length,
      });

      containers.each((index, element) => {
        const $element = $(element);
        const item: any = {};

        // Extract data using provided selectors
        Object.entries(selectors).forEach(([key, selector]) => {
          if (key === 'container') return; // Skip container selector

          const $target = selector.startsWith('.') || selector.startsWith('#') || selector.includes(' ')
            ? $element.find(selector)
            : $element.find(selector).first();

          if ($target.length > 0) {
            // Extract text, href, or other attributes based on selector
            if (selector.includes('@href')) {
              item[key] = $target.attr('href');
            } else if (selector.includes('@')) {
              const attr = selector.split('@')[1];
              item[key] = $target.attr(attr);
            } else {
              item[key] = $target.text().trim();
            }
          }
        });

        if (Object.keys(item).length > 0) {
          results.push(item);
        }
      });

      this.logger.debug('Data extraction completed', {
        extractedItems: results.length,
      });

      // Validate results if validator provided
      if (validator) {
        return results.map(item => validator.parse(item));
      }

      return results;

    } catch (error) {
      this.logger.error('Failed to extract data from HTML', {
        error: error instanceof Error ? error.message : String(error),
        selectorsUsed: Object.keys(selectors),
      });

      throw error;
    }
  }

  /**
   * Clean and normalize text data
   */
  static cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/[\r\n\t]/g, ' ') // Replace line breaks and tabs with space
      .trim() // Remove leading/trailing whitespace
      .replace(/&nbsp;/g, ' ') // Replace HTML non-breaking spaces
      .replace(/&amp;/g, '&') // Replace HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  /**
   * Parse Chilean date formats
   */
  static parseChileanDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Common Chilean date formats
    const formats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        const [, part1, part2, part3] = match;

        // Determine if it's DD/MM/YYYY or YYYY-MM-DD format
        if (part3.length === 4) {
          // DD/MM/YYYY or DD-MM-YYYY
          return new Date(parseInt(part3), parseInt(part2) - 1, parseInt(part1));
        } else {
          // YYYY-MM-DD
          return new Date(parseInt(part1), parseInt(part2) - 1, parseInt(part3));
        }
      }
    }

    // Try standard Date parsing as fallback
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
}
