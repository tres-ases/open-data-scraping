import {Ano, Mes} from "./dieta-anomes.model";
import axios from "axios";
import * as cheerio from "cheerio";
import Dieta from "@senado-cl/commons/dieta";

export const getAnos = async (ano?: string): Promise<Ano[]> => {
  const anos: Ano[] = [];

  const getAnos = await axios.get(Dieta.GET_ANO_URL);
  const $ = cheerio.load(getAnos.data);
  const anosOptions = $('select[name="annos"] > option');

  for(const option of anosOptions) {
    const id = $(option).attr('value');
    if(ano !== undefined && ano !== id) continue;
    if(id !== undefined && id !== "0")
      anos.push({
        id,
        description: $(option).text(),
        meses: await getMeses(id)
      });
  }

  return anos;
}

export const getMeses = async (ano: string): Promise<Mes[]> => {
  const meses: Mes[] = [];

  const getMeses = await axios.get(Dieta.GET_ANO_MES_URL(ano));
  const $ = cheerio.load(getMeses.data);

  const anosOptions = $('select[name="meses"] > option');

  for(const option of anosOptions) {
    const id = $(option).attr('value');
    if(id !== undefined && id !== "0" && id !== "00")
      meses.push({
        id,
        description: $(option).text()
      });
  }

  return meses;
}
