import {get} from 'aws-amplify/api';
import * as cheerio from 'cheerio';
import {ParlamentarioDetalle, PeriodoSenador} from "@senado-cl/global/senadores";

export interface AnoMeses {
  ano: number
  meses: number[]
}

const SenadoresService = {
  getAll: async () => {
    const response = await get({
      apiName: 'admin',
      path: '/senadores'
    }).response;
    return JSON.parse(await response.body.text()) as PeriodoSenador[];
  },

  getOne: async (id: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/senadores/${id}`
    }).response;
    return JSON.parse(await response.body.text()) as ParlamentarioDetalle;
  },

  getGastosOperacionalesAnoMes: async (id: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/senadores/${id}/gastos-operacionales/archivos`
    }).response;
    const $ = cheerio.load(await response.body.text());
    return $('ListBucketResult Contents')
      .map((_, el) => $(el).find('Key').text())
      .get()
      .map(item => {
        let parts = item.split("/");
        let ano = +parts[parts.findIndex(x => x.startsWith("ano="))].split("=")[1];
        let mes = +parts[parts.findIndex(x => x.startsWith("mes="))].split("=")[1];
        return {ano, mes}
      })
      .reduce((acc, curr) => {
        let value = acc.find(v => v.ano === curr.ano);
        if(value === undefined) {
          value = {ano: curr.ano, meses: []};
          acc.push(value);
        }
        value.meses.push(curr.mes);
        return acc;
      }, [] as AnoMeses[])

  },
}

export default SenadoresService;
