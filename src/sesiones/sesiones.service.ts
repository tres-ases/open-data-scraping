import puppeteer, {Page} from 'puppeteer';
import {Legislatura, SesionSala} from "./sesiones.model";

export const getSesiones = async (page: Page, legislatura: Legislatura): Promise<SesionSala[]> => {
  const sesionesSala: SesionSala[] = [];

  await Promise.all([
    page.select('select[name="legislaturas"]', legislatura.id),
    page.waitForNavigation({waitUntil: 'networkidle2'})
  ]);

  const sesionesOptions = await page.$$('select[name="sesionessala"] > option');

  for (const option of sesionesOptions) {
    const id = await option.evaluate(el => el.value);
    const description = await option.evaluate(el => el.innerText);

    if (id !== '0')
      sesionesSala.push({id, description})
  }

  return sesionesSala;
}

export const getLegistaturas = async (page: Page): Promise<Legislatura[]> => {
  const legislaturas: Legislatura[] = [];

  // Seleccionar el elemento del select Legislatura
  const legislaturaOptions = await page.$$('select[name="legislaturas"] > option');

  for (const option of legislaturaOptions) {
    const id = await option.evaluate(el => el.value);
    const description = await option.evaluate(el => el.innerText);

    legislaturas.push({id, description})
  }

  return legislaturas;
}
