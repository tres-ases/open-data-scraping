import {Page} from 'puppeteer';
import {Ano, Mes} from "../dieta/dieta-anomes.model";
import {GastosOperacionales, Parlamentario} from "./gastos-operacionales.model";
import * as _ from "lodash";

export const getAnos = async (page: Page): Promise<Ano[]> => {
  const anos: Ano[] = [];

  const anosOptions = await page.$$('select[name="annos"] > option');

  for (const option of anosOptions) {
    const id = await option.evaluate(el => el.value);
    const description = await option.evaluate(el => el.innerText);

    if (id !== '0' && id !== '00') anos.push({id, description, meses: []})
  }

  return anos;
}

export const getMeses = async (page: Page): Promise<Mes[]> => {
  const meses: Mes[] = [];

  const mesesOptions = await page.$$('select[name="meses"] > option');

  for (const option of mesesOptions) {
    const id = await option.evaluate(el => el.value);
    const description = await option.evaluate(el => el.innerText);

    if (id !== '0' && id !== '00') meses.push({id, description})
  }

  return meses;
}

export const getParlamentarios = async (page: Page): Promise<Parlamentario[]> => {
  const parlamentarios: Parlamentario[] = [];

  const parlamentariosOptions = await page.$$('select[name="parlamentarios"] > option');

  for (const option of parlamentariosOptions) {
    const id = await option.evaluate(el => el.value);
    const nombre = await option.evaluate(el => el.innerText);

    if (id !== '0' && id !== '00') parlamentarios.push({id, nombre})
  }

  return parlamentarios;
}

export const getGastosOperacionales = async (page: Page): Promise<GastosOperacionales[]> => {
  const gastosOperacionales: GastosOperacionales[] = [];

  let filas = await page.$$('div[class="col1"] table tr');
  if (filas.length > 1) filas = filas.slice(1);

  for (const f of filas) {
    const tds = await f.$$(':scope > *');

    if (tds.length === 2) {
      const data = [];
      for (const td of tds) {
        data.push(await td.evaluate(e => e.innerHTML));
      }
      if (data[0] === 'Concepto' || data[1] === 'Monto') continue;
      const concepto = cleanConcepto(data[0]);
      if (concepto.length === 0) continue;
      else if (concepto.toUpperCase() === 'TOTAL GASTO' || _.startsWith(concepto.toUpperCase(), 'TOTAL ') || concepto.toUpperCase().includes('FEBRERO')) break;
      gastosOperacionales.push({
        concepto, monto: cleanMonto(data[1])
      })
    }
    else if (tds.length > 2) {
      const data = [];
      for (const td of tds) {
        data.push(await td.evaluate(e => e.innerHTML));
      }
      let concepto = cleanConcepto(data[0]);
      // En las tablas del 2014 hacia abajo el texto del concepto está en la segunda columna
      if(concepto.length === 0) {
        concepto = cleanConcepto(data[1]);
      }
      if (concepto.toUpperCase() === 'TOTAL GASTO' || _.startsWith(concepto.toUpperCase(), 'TOTAL ') || concepto.includes('EJECUCION TRIMESTRAL MOVIL')) break;
      if (concepto.length === 0) continue;
      gastosOperacionales.push({
        concepto, monto: cleanMonto(data[tds.length-1])
      })
    }
  }

  return gastosOperacionales;
}

const cleanMonto = (valor: string): number => {
  valor = _.replace(valor,/<\/?[^>]+(>|$)/g, '');
  //valor = _.replace(valor,'<sup>', '');
  //valor = _.replace(valor,'<\/sup>', '');
  //valor = _.replace(valor,'<p>', '');
  //valor = _.replace(valor,'<p align="right">', '');
  //valor = _.replace(valor,'<\/p>', '');
  //valor = _.replace(valor,'<strong>', '');
  //valor = _.replace(valor,'<\/strong>', '');
  valor = _.replace(valor,/[$,.;]/g, '');
  const monto = +_.trim(valor);
  return isNaN(monto) || monto === null ? 0 : monto;
}

const cleanConcepto = (concepto: string): string => {
  concepto = _.replace(concepto,/<\/?[^>]+(>|$)/g, '');
  //concepto = _.replace(concepto,'<sup>', '');
  //concepto = _.replace(concepto,'<\/sup>', '');
  //concepto = _.replace(concepto,'<p>', '');
  //concepto = _.replace(concepto,'<\/p>', '');
  //concepto = _.replace(concepto,'<strong>', '');
  //concepto = _.replace(concepto,'<\/strong>', '');
  return _.trim(concepto);
}
