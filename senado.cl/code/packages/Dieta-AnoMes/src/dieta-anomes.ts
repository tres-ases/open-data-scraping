import puppeteer from 'puppeteer-core';
import { Handler } from 'aws-lambda';
import {Dieta} from '@senado-cl/commons/dieta';
import {getAnos, getMeses} from "./dieta-anomes.service";

export const handler: Handler<number> = async (event, context) => {
  try {
    const browser = await puppeteer.launch({headless: true});

    // Abrir la página web del Senado
    const page = await browser.newPage();
    await page.goto(Dieta.URL);

    const anos = await getAnos(page);

    for (const a of anos) {
      a.meses = await getMeses(page, a);
    }

    await browser.close();

    console.log('anos', anos);
    return anos;
    //saveJson(anos, DIETA_ANO_MES_PATH);
  } catch (err) {
    console.log(err);
    return "ERROR"
  }
};
