import { get, post } from 'aws-amplify/api';
import {LegislaturaRaw} from "@senado-cl/global/legislaturas";

const LegislaturaService = {
  getAll: async () => {
    const response = await get({
      apiName: 'admin',
      path: '/raw/legislaturas'
    }).response;
    return JSON.parse(await response.body.text()) as LegislaturaRaw[];
  },

  extract: async () => {
    await post({
      apiName: 'admin',
      path: '/scraper/legislaturas'
    }).response;
  }
}

export default LegislaturaService;
