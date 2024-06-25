import puppeteer from 'puppeteer';
import { Handler } from 'aws-lambda';
import {saveJson} from "../utils.service";
import {DIETA_ANO_MES_PATH, DIETA_URL} from "../config";
import {getAnos, getMeses} from "./dieta-anomes.service";
import {Ano} from "./dieta-anomes.model";

export const handler: Handler<number> = async (event, context) => {
  try {
    const browser = await puppeteer.launch({headless: 'new'});

    // Abrir la página web del Senado
    const page = await browser.newPage();
    await page.goto(DIETA_URL);

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
