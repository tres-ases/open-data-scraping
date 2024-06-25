import puppeteer from 'puppeteer';
import {existsFile, saveJson} from "../utils.service";
import {
  GASTOS_OPERACIONALES_LIST_PATH,
  GASTOS_OPERACIONALES_PARLAMENTARIOS_PATH,
  GASTOS_OPERACIONALES_URL
} from "../config";
import {Resultados} from "../commons/commons.model";
import {getAnos, getGastosOperacionales, getMeses, getParlamentarios} from "./gastos-operacionales.service";
import {ParlamentariosMap} from "./gastos-operacionales.model";

(async () => {
  const browser = await puppeteer.launch({headless: 'new'});

  // Abrir la página web del Senado
  const page = await browser.newPage();
  await page.goto(GASTOS_OPERACIONALES_URL);

  const resultados: Resultados = {
    extracciones: {
      exitosas: 0,
      fallidas: 0
    },
    archivos: 0
  };

  const maestroParlamentarios: ParlamentariosMap = {};
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

      const parlamentarios = await getParlamentarios(page);
      parlamentarios.forEach(p => maestroParlamentarios[p.id] = p.nombre);
      for (const p of parlamentarios) {
        const filePath = `${GASTOS_OPERACIONALES_LIST_PATH}/A${a.id}/M${m.id}/P${p.id}.json`;
        console.log('Año', a.id, 'Mes', m.id, 'Parlamentario', `(id: ${p.id})`, p.nombre);
        if (existsFile(filePath)) {
          console.log('Archivo ya existe');
          resultados.archivos++;
        } else {
          try {
            await Promise.all([
              page.select('select[name="parlamentarios"]', p.id),
              page.waitForNavigation({waitUntil: 'networkidle2'})
            ]);

            const gastosOperacionales = await getGastosOperacionales(page);
            console.log('Gastos operacionales', `${gastosOperacionales.length} registros`);
            saveJson(gastosOperacionales, filePath);
            resultados.extracciones.exitosas++;
            resultados.archivos++;
          } catch (err) {
            resultados.extracciones.fallidas++;
            console.error('Error al obtener las dietas', err);
          }
        }
      }
    }
  }

  saveJson(maestroParlamentarios, GASTOS_OPERACIONALES_PARLAMENTARIOS_PATH);
  console.log('Almacenando maestro de parlamentarios...');

  await browser.close();

  console.info('');
  console.info('---');
  console.info('Proceso de Extracción Finalizado');
  console.info('Descargas exitosas: ', resultados.extracciones.exitosas);
  console.info('Descargas fallidas: ', resultados.extracciones.fallidas);
  console.info('Archivos:           ', resultados.archivos);
  console.info('---');

})();
