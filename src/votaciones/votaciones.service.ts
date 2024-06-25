import puppeteer, {Page} from 'puppeteer';
import {Legislatura, SesionSala} from "../sesiones/sesiones.model";
import {Votacion} from "./votaciones.model";

export const getVotacionesSala = async (page: Page, legislaturaId: string, sesionSalaId: string): Promise<Votacion[]> => {
  const votacionesSala: Votacion[] = [];

  await Promise.all([
    page.select('select[name="legislaturas"]', legislaturaId),
    page.waitForNavigation({waitUntil: 'networkidle2'})
  ]);

  await Promise.all([
    page.select('select[name="sesionessala"]', sesionSalaId),
    page.waitForNavigation({waitUntil: 'networkidle2'})
  ]);

  const filas = await page.$$('div[id="main"] table tr');

  for (const f of filas) {
    const tds = await f.$$(':scope > *')
    if(tds.length === 6) {
      const data = [];
      for(const td of tds) {
        data.push(await td.evaluate(e => e.innerHTML));
      }
      if(data[0] === 'Fecha' || data[1] === 'Boletín' || data[2] === 'Si' || data[3] === 'No' || data[4] === 'Abs.' || data[5] === 'Pareo') continue;
      votacionesSala.push({
        fecha: data[0], boletin: data[1], si: +data[2], no: +data[3], abs: +data[4], pareo: +data[5]
      })
    }
  }

  return votacionesSala;
}
