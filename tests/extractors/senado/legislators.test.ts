#!/usr/bin/env ts-node

/**
 * Test para el extractor de legisladores del Senado
 */

import { WebScraper } from '@open-data-motivation/extractors-core';

async function testLegislatorsExtraction() {
  console.log('👥 Probando extracción de legisladores del Senado...\n');

  try {
    const scraper = new WebScraper('legislators-test', {
      baseUrl: 'https://www.senado.cl',
      timeout: 15000,
      rateLimit: {
        requests: 1,
        period: 3000,
      },
    });

    console.log('🔍 Accediendo a la página de senadores...');
    const $ = await scraper.fetchHtml('/senadoras-y-senadores/listado-de-senadoras-y-senadores');

    const title = $('title').text();
    console.log(`✅ Título: "${title}"`);

    // Buscar diferentes selectores posibles para senadores
    const possibleSelectors = [
      '.senador-item',
      '.legislator-card',
      '.senador-card',
      '.senador',
      '.legislador',
      '.card',
      '.item',
      'tr', // Si es una tabla
      '.list-item',
      '.member'
    ];

    console.log(`\n🔍 Buscando elementos de senadores...`);

    for (const selector of possibleSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`   ${selector}: ${elements.length} elementos encontrados`);

        // Analizar el primer elemento
        const firstElement = elements.first();
        const text = firstElement.text().trim().substring(0, 100);
        const hasLinks = firstElement.find('a').length;
        const hasImages = firstElement.find('img').length;

        console.log(`     Texto muestra: "${text}..."`);
        console.log(`     Enlaces: ${hasLinks}, Imágenes: ${hasImages}`);
      }
    }

    // Buscar información específica de senadores
    console.log(`\n📊 Buscando información específica...`);

    const names = $('h1, h2, h3, h4, .name, .nombre, .title').filter((_, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes('senador') || text.includes('senadora') ||
             (text.length > 5 && text.length < 50 && /^[a-záéíóúñ\s]+$/i.test(text));
    });

    console.log(`   Posibles nombres: ${names.length}`);
    if (names.length > 0) {
      names.slice(0, 3).each((_, el) => {
        console.log(`     - "${$(el).text().trim()}"`);
      });
    }

    // Buscar partidos políticos
    const parties = $('.partido, .party, .political-party').length;
    console.log(`   Elementos de partido: ${parties}`);

    // Buscar regiones
    const regions = $('.region, .constituency, .circunscripcion').length;
    console.log(`   Elementos de región: ${regions}`);

    // Buscar enlaces de detalle
    const detailLinks = $('a[href*="senador"], a[href*="legislador"], a[href*="perfil"], a[href*="detalle"]');
    console.log(`   Enlaces de detalle: ${detailLinks.length}`);

    if (detailLinks.length > 0) {
      console.log(`\n🔗 Ejemplos de enlaces de detalle:`);
      detailLinks.slice(0, 3).each((_, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        console.log(`     - ${href} ("${text}")`);
      });
    }

    console.log(`\n✅ Análisis completado! La página contiene datos extraíbles.`);

  } catch (error) {
    console.error(`❌ Error:`, error);

    if (error instanceof Error) {
      if (error.message.includes('404')) {
        console.log(`💡 La URL de senadores puede haber cambiado. Verifica la estructura del sitio.`);
      } else if (error.message.includes('timeout')) {
        console.log(`💡 Timeout - intenta aumentar el tiempo de espera.`);
      }
    }
  }
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  testLegislatorsExtraction().catch(console.error);
}

export { testLegislatorsExtraction };
