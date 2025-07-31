#!/usr/bin/env ts-node

/**
 * Script de prueba manual para los extractores del Senado
 *
 * Uso:
 * npx ts-node libs/extractors/senado/src/test-extraction.ts [extractor] [options]
 *
 * Ejemplos:
 * npx ts-node libs/extractors/senado/src/test-extraction.ts legislators
 * npx ts-node libs/extractors/senado/src/test-extraction.ts votes --limit 5
 * npx ts-node libs/extractors/senado/src/test-extraction.ts sessions --date-range 2024-01-01,2024-01-31
 */

import { SenadoLegislatorsExtractor } from './lib/legislators-extractor';
import { SenadoVotesExtractor } from './lib/votes-extractor';
import { SenadoSessionsExtractor } from './lib/sessions-extractor';

// Mock environment variables para testing
process.env.DATA_BUCKET_NAME = 'test-bucket';
process.env.SESSIONS_TABLE_NAME = 'test-table';
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'test';

async function testLegislatorsExtractor(options: any = {}) {
  console.log('🏛️  Probando extractor de legisladores del Senado...\n');

  const extractor = new SenadoLegislatorsExtractor();

  // Mock AWS calls
  (extractor as any).storeRawData = async (batch: any) => {
    console.log(`📦 Datos que se almacenarían en S3:`, {
      source: batch.source,
      dataType: batch.dataType,
      recordCount: batch.records.length,
      sampleRecord: batch.records[0] || null
    });
    return 's3://test-bucket/test-key';
  };

  (extractor as any).storeExtractionMetadata = async (id: string, input: any, result: any) => {
    console.log(`📊 Metadata que se almacenaría:`, {
      extractionId: id,
      recordsExtracted: result.recordsExtracted,
      processingTime: result.processingTime
    });
  };

  const input = {
    source: 'senado' as const,
    dataType: 'legislators' as const,
    batchSize: options.limit || 10,
    retryCount: 0,
    maxRetries: 3,
  };

  try {
    const startTime = Date.now();
    const result = await extractor.handler(input);
    const duration = Date.now() - startTime;

    console.log(`✅ Extracción completada en ${duration}ms`);
    console.log(`📈 Resultados:`, {
      success: result.success,
      recordsExtracted: result.data?.recordsExtracted,
      recordsStored: result.data?.recordsStored,
      processingTime: result.data?.processingTime,
      errors: result.data?.errors?.length || 0
    });

    if (result.error) {
      console.error(`❌ Error:`, result.error);
    }

  } catch (error) {
    console.error(`💥 Error durante la extracción:`, error);
  }
}

async function testVotesExtractor(options: any = {}) {
  console.log('🗳️  Probando extractor de votaciones del Senado...\n');

  const extractor = new SenadoVotesExtractor();

  // Mock AWS calls
  (extractor as any).storeRawData = async (batch: any) => {
    console.log(`📦 Datos que se almacenarían en S3:`, {
      source: batch.source,
      dataType: batch.dataType,
      recordCount: batch.records.length,
      sampleRecord: batch.records[0] || null
    });
    return 's3://test-bucket/test-key';
  };

  (extractor as any).storeExtractionMetadata = async (id: string, input: any, result: any) => {
    console.log(`📊 Metadata que se almacenaría:`, {
      extractionId: id,
      recordsExtracted: result.recordsExtracted,
      processingTime: result.processingTime
    });
  };

  const input = {
    source: 'senado' as const,
    dataType: 'votes' as const,
    batchSize: options.limit || 5,
    retryCount: 0,
    maxRetries: 3,
    dateRange: options.dateRange ? {
      start: `${options.dateRange.split(',')[0]}T00:00:00Z`,
      end: `${options.dateRange.split(',')[1]}T23:59:59Z`
    } : undefined
  };

  try {
    const startTime = Date.now();
    const result = await extractor.handler(input);
    const duration = Date.now() - startTime;

    console.log(`✅ Extracción completada en ${duration}ms`);
    console.log(`📈 Resultados:`, {
      success: result.success,
      recordsExtracted: result.data?.recordsExtracted,
      recordsStored: result.data?.recordsStored,
      processingTime: result.data?.processingTime,
      errors: result.data?.errors?.length || 0
    });

    if (result.error) {
      console.error(`❌ Error:`, result.error);
    }

  } catch (error) {
    console.error(`💥 Error durante la extracción:`, error);
  }
}

async function testSessionsExtractor(options: any = {}) {
  console.log('📋 Probando extractor de sesiones del Senado...\n');

  const extractor = new SenadoSessionsExtractor();

  // Mock AWS calls
  (extractor as any).storeRawData = async (batch: any) => {
    console.log(`📦 Datos que se almacenarían en S3:`, {
      source: batch.source,
      dataType: batch.dataType,
      recordCount: batch.records.length,
      sampleRecord: batch.records[0] || null
    });
    return 's3://test-bucket/test-key';
  };

  (extractor as any).storeExtractionMetadata = async (id: string, input: any, result: any) => {
    console.log(`📊 Metadata que se almacenaría:`, {
      extractionId: id,
      recordsExtracted: result.recordsExtracted,
      processingTime: result.processingTime
    });
  };

  const input = {
    source: 'senado' as const,
    dataType: 'sessions' as const,
    batchSize: options.limit || 5,
    retryCount: 0,
    maxRetries: 3,
    dateRange: options.dateRange ? {
      start: `${options.dateRange.split(',')[0]}T00:00:00Z`,
      end: `${options.dateRange.split(',')[1]}T23:59:59Z`
    } : undefined
  };

  try {
    const startTime = Date.now();
    const result = await extractor.handler(input);
    const duration = Date.now() - startTime;

    console.log(`✅ Extracción completada en ${duration}ms`);
    console.log(`📈 Resultados:`, {
      success: result.success,
      recordsExtracted: result.data?.recordsExtracted,
      recordsStored: result.data?.recordsStored,
      processingTime: result.data?.processingTime,
      errors: result.data?.errors?.length || 0
    });

    if (result.error) {
      console.error(`❌ Error:`, result.error);
    }

  } catch (error) {
    console.error(`💥 Error durante la extracción:`, error);
  }
}

async function testWebScraper() {
  console.log('🌐 Probando conectividad con senado.cl...\n');

  try {
    const { WebScraper } = await import('@open-data-motivation/extractors-core');

    const scraper = new WebScraper('test-scraper', {
      baseUrl: 'https://www.senado.cl',
      timeout: 10000,
      rateLimit: {
        requests: 1,
        period: 2000,
      },
    });

    console.log('🔍 Intentando acceder a la página principal...');
    const $ = await scraper.fetchHtml('/');

    const title = $('title').text();
    const bodyText = $('body').text().substring(0, 200);

    console.log(`✅ Conexión exitosa!`);
    console.log(`📄 Título de la página: "${title}"`);
    console.log(`📝 Contenido (primeros 200 chars): "${bodyText}..."`);

    // Probar algunos selectores comunes
    const links = $('a').length;
    const images = $('img').length;
    const forms = $('form').length;

    console.log(`🔗 Elementos encontrados:`, {
      enlaces: links,
      imágenes: images,
      formularios: forms
    });

  } catch (error) {
    console.error(`💥 Error de conectividad:`, error);
    console.log(`\n💡 Posibles causas:`);
    console.log(`   - Sin conexión a internet`);
    console.log(`   - senado.cl no disponible`);
    console.log(`   - Firewall bloqueando la conexión`);
    console.log(`   - Rate limiting del servidor`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const extractor = args[0];

  // Parse options
  const options: any = {};
  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }

  console.log(`🚀 Iniciando pruebas de extracción del Senado de Chile\n`);
  console.log(`⏰ ${new Date().toLocaleString()}\n`);

  if (!extractor) {
    console.log(`📖 Uso: npx ts-node libs/extractors/senado/src/test-extraction.ts [extractor] [options]\n`);
    console.log(`🎯 Extractores disponibles:`);
    console.log(`   - legislators: Extrae información de senadores`);
    console.log(`   - votes: Extrae votaciones`);
    console.log(`   - sessions: Extrae sesiones`);
    console.log(`   - expenses: Extrae gastos`);
    console.log(`   - connectivity: Prueba conectividad con senado.cl\n`);
    console.log(`⚙️  Opciones:`);
    console.log(`   --limit N: Limita el número de registros a extraer`);
    console.log(`   --date-range YYYY-MM-DD,YYYY-MM-DD: Rango de fechas\n`);
    console.log(`📝 Ejemplos:`);
    console.log(`   npx ts-node libs/extractors/senado/src/test-extraction.ts legislators --limit 3`);
    console.log(`   npx ts-node libs/extractors/senado/src/test-extraction.ts votes --limit 2`);
    console.log(`   npx ts-node libs/extractors/senado/src/test-extraction.ts connectivity`);
    return;
  }

  switch (extractor) {
    case 'legislators':
      await testLegislatorsExtractor(options);
      break;
    case 'votes':
      await testVotesExtractor(options);
      break;
    case 'sessions':
      await testSessionsExtractor(options);
      break;
    case 'expenses':
      console.log('💰 Extractor de gastos aún no implementado en el test');
      break;
    case 'connectivity':
      await testWebScraper();
      break;
    default:
      console.error(`❌ Extractor desconocido: ${extractor}`);
      console.log(`✅ Extractores disponibles: legislators, votes, sessions, expenses, connectivity`);
  }

  console.log(`\n🏁 Prueba completada`);
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}
