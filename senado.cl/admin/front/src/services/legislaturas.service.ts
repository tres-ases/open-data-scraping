import {get, post} from 'aws-amplify/api';
import {LegislaturaDtl, LegislaturaMapDtl, LegislaturaRaw} from "@senado-cl/global/legislaturas";

const LegislaturaService = {
  getRawList: async () => {
    try {
      const response = await get({
        apiName: 'admin',
        path: '/raw/legislaturas'
      }).response;
      return JSON.parse(await response.body.text()) as LegislaturaRaw[];
    } catch (error) {
      return [] as LegislaturaRaw[];
    }
  },

  getDtlList: async () => {
    try {
      const response = await get({
        apiName: 'admin',
        path: '/dtl/legislaturas'
      }).response;
      return JSON.parse(await response.body.text()) as LegislaturaMapDtl;
    } catch (error) {
      return {} as LegislaturaMapDtl;
    }
  },

  getDtl: async (legId: string | number) => {
    const response = await get({
      apiName: 'admin',
      path: `/dtl/legislaturas/${legId}`
    }).response;
    return JSON.parse(await response.body.text()) as LegislaturaDtl;
  },

  scrape: async () => {
    await post({
      apiName: 'admin',
      path: '/scraper/legislaturas'
    }).response;
  },

  distill: async (legId: string | number) => {
    await post({
      apiName: 'admin',
      path: `/distiller/legislaturas/${legId}`
    }).response;
  }
}

export default LegislaturaService;
