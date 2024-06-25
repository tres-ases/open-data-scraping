import puppeteer from 'puppeteer';
import {readJson} from "../utils.service";
import {GASTOS_OPERACIONALES_PARLAMENTARIOS_PATH, PERSONAL_APOYO_URL} from "../config";
import {Resultados} from "../commons/commons.model";
import {ParlamentariosMap} from "../gastos-operacionales/gastos-operacionales.model";
import {findParlamentarioId, getAnos, getMeses} from "./personal-apoyo.service";
import {getPage} from "../commons/commons.service";

(async () => {
  const parlamentarios = await readJson<ParlamentariosMap>(GASTOS_OPERACIONALES_PARLAMENTARIOS_PATH);

  // Lanzar un navegador Chromium sin interfaz gráfica
  const browser = await puppeteer.launch({headless: 'new'});

  const page = await getPage(browser);

  //Se le alarga el timeout porque la página sigue cargando algunos recursos por casi 1 minuto
  await page.goto(PERSONAL_APOYO_URL, {timeout: 100000});

  const resultados: Resultados = {
    extracciones: {
      exitosas: 0,
      fallidas: 0
    },
    archivos: 0
  };

  const anos = await getAnos(page);

  for (const a of anos) {

    await Promise.all([
      page.select('select[name="annos"]', a.id),
      page.waitForNavigation({waitUntil: 'networkidle2'})
    ]);

    const meses = await getMeses(page);
    for (const m of meses) {

      await Promise.all([
        page.select('select[name="meses"]', m.id),
        page.waitForNavigation({waitUntil: 'networkidle2'})
      ]);

      const tables = await page.$$('div[class="col1"] table');
      console.log('largo tablas', tables.length);

      for(const t of tables) {
        const id = await t.evaluate(el => el.getAttribute('id'));
        console.log('id', id);

        const parlamentarioId = id !== null ? findParlamentarioId(parlamentarios, id) : null;
        console.log('año', a.id, 'mes', m.id, 'parlamentario', id, 'id', parlamentarioId);
      }
    }
  }

  await browser.close();

  console.info('');
  console.info('---');
  console.info('Proceso de Extracción Finalizado');
  console.info('Descargas exitosas: ', resultados.extracciones.exitosas);
  console.info('Descargas fallidas: ', resultados.extracciones.fallidas);
  console.info('Archivos:           ', resultados.archivos);
  console.info('---');

})();
