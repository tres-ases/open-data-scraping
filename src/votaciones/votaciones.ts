import puppeteer from 'puppeteer';
import {existsFile, readJson, saveJson} from "../utils.service";
import {Legislatura} from "../sesiones/sesiones.model";
import {LEGISLATURA_SESION_VOTACION_URL, SESIONES_PATH, VOTACIONES_LIST_PATH} from "../config";
import {getVotacionesSala} from "./votaciones.service";
import {Resultados} from "../commons/commons.model";

(async () => {

  const legislaturas = await readJson<Legislatura[]>(SESIONES_PATH);

  // Lanzar un navegador Chromium sin interfaz gráfica
  //const browser = await puppeteer.launch({headless: 'new'});
  const browser = await puppeteer.launch({headless: 'new'});

  // Abrir la página web del Senado
  const page = await browser.newPage();
  await page.goto(LEGISLATURA_SESION_VOTACION_URL);

  const resultados: Resultados = {
    extracciones: {
      exitosas: 0,
      fallidas: 0
    },
    archivos: 0
  };

  for (const l of legislaturas) {
    for (const ss of l.sesionesSala) {
      const filePath = `${VOTACIONES_LIST_PATH}/L${l.id}/SS${ss.id}.json`;
      console.log('Legislatura', `(id:${l.id})`, l.description, 'Sesion Sala', `(id:${ss.id})`, ss.description);
      if (existsFile(filePath)) {
        console.log('Archivo ya existe');
        resultados.archivos++;
      } else {
        try {
          const votaciones = await getVotacionesSala(page, l.id, ss.id);
          console.log('Votaciones', `${votaciones.length} registros`);
          saveJson(votaciones, filePath);
          resultados.extracciones.exitosas++;
          resultados.archivos++;
        } catch (err) {
          resultados.extracciones.fallidas++;
          console.error('Error al obtener las votaciones', err);
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
