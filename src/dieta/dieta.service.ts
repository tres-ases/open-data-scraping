import {Page} from 'puppeteer';
import {Dieta} from "./dieta.model";
import {cleanNumber} from "../commons/commons.service";

export const getDietas = async (page: Page, anoId: string, mesId: string): Promise<Dieta[]> => {
  const dietas: Dieta[] = [];

  await Promise.all([
    page.select('select[name="annos"]', anoId),
    page.waitForNavigation({waitUntil: 'networkidle2'})
  ]);

  await Promise.all([
    page.select('select[name="meses"]', mesId),
    page.waitForNavigation({waitUntil: 'networkidle2'})
  ]);

  let filas = await page.$$('div[class="col1"] table tr');
  if(filas.length > 1) filas = filas.slice(1);

  for (const f of filas) {
    const tds = await f.$$(':scope > *');

    if(tds.length === 4) {
      const data = [];
      for(const td of tds) {
        data.push(await td.evaluate(e => e.innerHTML));
      }
      if(data[0] === 'Nombre' || data[1] === 'Dieta' || data[2] === 'Impuesto, salud y prevision' || data[3] === 'Saldo') continue;
      dietas.push({
        nombre: data[0], monto: cleanNumber(data[1]), descuentos: cleanNumber(data[2]), saldo: cleanNumber(data[3])
      })
    }
  }

  return dietas;
}
