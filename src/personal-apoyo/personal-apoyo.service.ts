import {Page} from 'puppeteer';
import {Ano, Mes} from "../dieta/dieta-anomes.model";
import {
  GastosOperacionales,
  Parlamentario,
  ParlamentariosMap
} from "../gastos-operacionales/gastos-operacionales.model";
import * as _ from "lodash";

export const findParlamentarioId = (parlamentarioMap: ParlamentariosMap, text: string): string | null => {
  const split = text.toUpperCase().split(/(\s+)/);

  map:
    for (const id in parlamentarioMap) {
      const name = parlamentarioMap[id].toUpperCase();
      for (const s of split) {
        if (s.trim().length === 0) continue;
        if (!name.includes(s)) continue map;
      }
      return id;
    }

  return null;
};

export const getAnos = async (page: Page): Promise<Ano[]> => {
  const anos: Ano[] = [];

  const anosOptions = await page.$$('select[name="annos"] > option');

  for (const option of anosOptions) {
    const id = await option.evaluate(el => el.value);
    const description = await option.evaluate(el => el.innerText);

    if (id !== '0' && id !== '00') anos.push({id, description, meses: []})
  }

  return anos;
};

export const getMeses = async (page: Page): Promise<Mes[]> => {
  const meses: Mes[] = [];

  const mesesOptions = await page.$$('select[name="meses"] > option');

  for (const option of mesesOptions) {
    const id = await option.evaluate(el => el.value);
    const description = await option.evaluate(el => el.innerText);

    if (id !== '0' && id !== '00') meses.push({id, description})
  }

  return meses;
};
