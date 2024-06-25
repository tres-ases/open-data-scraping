import puppeteer from 'puppeteer';
import {existsFile, readJson, saveJson} from "../utils.service";
import {DIETA_ANO_MES_PATH, DIETA_LIST_PATH, DIETA_URL} from "../config";
import {Resultados} from "../commons/commons.model";
import {Ano} from "./dieta-anomes.model";
import {getDietas} from "./dieta.service";

(async () => {
  const anos = await readJson<Ano[]>(DIETA_ANO_MES_PATH);

  // Lanzar un navegador Chromium sin interfaz gráfica
  //const browser = await puppeteer.launch({headless: 'new'});
  const browser = await puppeteer.launch({headless: 'new'});

  // Abrir la página web del Senado
  const page = await browser.newPage();
  await page.goto(DIETA_URL);

  const resultados: Resultados = {
    extracciones: {
      exitosas: 0,
      fallidas: 0
    },
    archivos: 0
  };

  for (const a of anos) {
    for (const m of a.meses) {
      const filePath = `${DIETA_LIST_PATH}/A${a.id}/M${m.id}.json`;
      console.log('Año', a.id, 'Mes', m.id);
      if (existsFile(filePath)) {
        console.log('Archivo ya existe');
        resultados.archivos++;
      } else {
        try {
          const dietas = await getDietas(page, a.id, m.id);
          console.log('Dietas', `${dietas.length} registros`);
          saveJson(dietas, filePath);
          resultados.extracciones.exitosas++;
          resultados.archivos++;
        } catch (err) {
          resultados.extracciones.fallidas++;
          console.error('Error al obtener las dietas', err);
        }
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
