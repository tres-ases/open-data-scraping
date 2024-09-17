import { get, post } from 'aws-amplify/api';
import {LegislaturaDtl, LegislaturaRaw} from "@senado-cl/global/legislaturas";

interface GetDTlList {
  [id: number]: LegislaturaDtl
}

const LegislaturaService = {
  getRawList: async () => {
    const response = await get({
      apiName: 'admin',
      path: '/raw/legislaturas'
    }).response;
    return JSON.parse(await response.body.text()) as LegislaturaRaw[];
  },

  getDtlList: async () => {
    const response = await get({
      apiName: 'admin',
      path: '/dtl/legislaturas'
    }).response;
    return JSON.parse(await response.body.text()) as GetDTlList;
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
