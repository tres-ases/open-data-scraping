import {Page} from 'puppeteer';
import {Ano, Mes} from "./dieta-anomes.model";

export const getAnos = async (page: Page): Promise<Ano[]> => {
  const anos: Ano[] = [];

  const legislaturaOptions = await page.$$('select[name="annos"] > option');

  for (const option of legislaturaOptions) {
    const id = await option.evaluate(el => el.value);
    const description = await option.evaluate(el => el.innerText);

    if (id !== '0' && id !== '00') anos.push({id, description, meses: []})
  }

  return anos;
}

export const getMeses = async (page: Page, ano: Ano): Promise<Mes[]> => {
  const meses: Mes[] = [];

  await Promise.all([
    page.select('select[name="annos"]', ano.id),
    page.waitForNavigation({waitUntil: 'networkidle2'})
  ]);

  const mesesOptions = await page.$$('select[name="meses"] > option');

  for (const option of mesesOptions) {
    const id = await option.evaluate(el => el.value);
    const description = await option.evaluate(el => el.innerText);

    if (id !== '0' && id !== '00') meses.push({id, description})
  }

  return meses;
}
