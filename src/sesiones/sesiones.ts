import puppeteer from 'puppeteer';
import {getLegistaturas, getSesiones} from "./sesiones.service";
import {saveJson} from "../utils.service";
import {LEGISLATURA_SESION_VOTACION_URL, SESIONES_PATH} from "../config";

(async () => {
  // Lanzar un navegador Chromium sin interfaz gráfica
  const browser = await puppeteer.launch({headless: 'new'});

  // Abrir la página web del Senado
  const page = await browser.newPage();
  await page.goto(LEGISLATURA_SESION_VOTACION_URL);

  const legislaturas = await getLegistaturas(page);

  for(const l of legislaturas) {
    l.sesionesSala = await getSesiones(page, l);
  }

  //console.log(legislaturas);

  await browser.close();

  saveJson(legislaturas, SESIONES_PATH)

})();
