import { get, post } from 'aws-amplify/api';
import {Legislatura} from "@senado-cl/global/legislaturas";

const LegislaturaService = {
  getAll: async () => {
    const response = await get({
      apiName: 'admin',
      path: '/legislaturas'
    }).response;
    return JSON.parse(await response.body.text()) as Legislatura[];
  },

  extract: async () => {
    await post({
      apiName: 'admin',
      path: '/legislaturas'
    }).response;
  }
}

export default LegislaturaService;
