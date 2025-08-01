#!/usr/bin/env ts-node

/**
 * Test para el extractor de votaciones del Senado
 * Incluye pruebas tanto de scraping como de API
 */

import { WebScraper } from '@open-data/extractors-core';
import axios from 'axios';

async function testVotesAPI() {
  console.log('🗳️  Probando API de votaciones del Senado...\n');

  try {
    const url = 'https://web-back.senado.cl/api/votes?id_legislatura=505&limit=10&offset=0&palabra_clave=&desde=&hasta=';

    console.log(`📡 Consultando: ${url}`);

    const response = await axios.get(url, { timeout: 15000 });

    console.log(`✅ Status: ${response.status}`);

    if (response.data && typeof response.data === 'object') {
      const responseData = response.data;
      const actualData = responseData.data;

      console.log(`\n🎉 ¡DATOS OBTENIDOS EXITOSAMENTE!`);
      console.log(`📊 Resumen:`);
      console.log(`   Total disponible: ${actualData?.total || 'No especificado'}`);
      console.log(`   Votaciones en respuesta: ${actualData?.data?.length || 0}`);
      console.log(`   Status: ${responseData.status || 'No especificado'}`);
      console.log(`   Results: ${responseData.results || 'No especificado'}`);

      if (actualData?.data && Array.isArray(actualData.data) && actualData.data.length > 0) {
        console.log(`\n🗳️  Ejemplos de votaciones:`);

        // Mostrar las primeras 3 votaciones
        actualData.data.slice(0, 3).forEach((vote: any, index: number) => {
          console.log(`\n   ${index + 1}. Votación ID: ${vote.ID_VOTACION}`);
          console.log(`      Sesión: ${vote.NUMERO_SESION} (ID: ${vote.ID_SESION})`);
          console.log(`      Fecha: ${vote.FECHA_VOTACION}`);
          console.log(`      Hora: ${vote.HORA}`);
          console.log(`      Tema: "${vote.TEMA?.substring(0, 80)}..."`);
          console.log(`      Quorum: ${vote.QUORUM}`);
          console.log(`      Boletín: ${vote.BOLETIN || 'N/A'}`);
          console.log(`      Resultados: SI=${vote.SI}, NO=${vote.NO}, ABS=${vote.ABS}, PAREO=${vote.PAREO}`);

          if (vote.VOTACIONES) {
            const votaciones = vote.VOTACIONES;
            console.log(`      Detalle: ${votaciones.SI?.length || 0} SI, ${votaciones.NO?.length || 0} NO, ${votaciones.ABSTENCION?.length || 0} ABS, ${votaciones.PAREO?.length || 0} PAREO`);

            if (votaciones.SI && votaciones.SI.length > 0) {
              const senator = votaciones.SI[0];
              console.log(`      Ej. Senador (SI): ${senator.NOMBRE} ${senator.APELLIDO_PATERNO} ${senator.APELLIDO_MATERNO}`);
            }
          }
        });

        console.log(`\n🔧 Parámetros que funcionan:`);
        console.log(`   ✅ Base URL: https://web-back.senado.cl/api/votes`);
        console.log(`   ✅ id_legislatura: 505 (legislatura actual)`);
        console.log(`   ✅ limit: 10 (número de resultados)`);
        console.log(`   ✅ offset: 0 (paginación)`);
        console.log(`   ✅ palabra_clave: (vacío para todas)`);
        console.log(`   ✅ desde: (vacío para sin filtro de fecha)`);
        console.log(`   ✅ hasta: (vacío para sin filtro de fecha)`);

        console.log(`\n🚀 ¡API FUNCIONAL CONFIRMADA!`);
      }
    }

  } catch (error) {
    console.error(`❌ Error en API:`, error instanceof Error ? error.message : error);
  }
}

async function testVotesScraping() {
  console.log('\n🕷️  Probando scraping de votaciones como fallback...\n');

  try {
    const scraper = new WebScraper('votes-test', {
      baseUrl: 'https://www.senado.cl',
      timeout: 15000,
      rateLimit: {
        requests: 1,
        period: 3000,
      },
    });

    console.log('🔍 Accediendo a la página de votaciones...');
    const $ = await scraper.fetchHtml('/actividad-legislativa/sala/votaciones');

    const title = $('title').text();
    console.log(`✅ Título: "${title}"`);

    // Buscar elementos de votaciones
    const possibleSelectors = [
      '.votacion-item',
      '.vote-card',
      '.votacion-card',
      '.votacion',
      '.vote',
      '.card',
      '.item',
      'tr',
      '.list-item',
      '.voting'
    ];

    console.log(`\n🔍 Buscando elementos de votaciones...`);

    for (const selector of possibleSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`   ${selector}: ${elements.length} elementos encontrados`);
      }
    }

    console.log(`\n✅ Scraping completado como fallback.`);

  } catch (error) {
    console.error(`❌ Error en scraping:`, error instanceof Error ? error.message : error);
  }
}

async function testVotesExtraction() {
  console.log('🗳️  Probando extracción completa de votaciones del Senado...\n');

  // Probar primero la API (método preferido)
  await testVotesAPI();

  // Probar scraping como fallback
  await testVotesScraping();
}

// Ejecutar solo si es llamado directamente
if (require.main === module) {
  testVotesExtraction().catch(console.error);
}

export { testVotesExtraction, testVotesAPI, testVotesScraping };
