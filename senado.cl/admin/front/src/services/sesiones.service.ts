import {get, post} from 'aws-amplify/api';
import {SesionRaw} from "@senado-cl/global/sesiones";

const SesionesService = {
  getAll: async (legId: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/raw/legislaturas/${legId}/sesiones`
    }).response;
    return JSON.parse(await response.body.text()) as SesionRaw[];
  },

  getOne: async (sesId: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/raw/sesiones/${sesId}`
    }).response;
    return JSON.parse(await response.body.text()) as SesionRaw;
  },

  extract: async (legId: string | number) => {
    await post({
      apiName: 'admin',
      path: '/scraper/sesiones',
      options: {
        queryParams: {legId: `${legId}`}
      }
    }).response;
  },

  extractStatus: async (exeId: string) => {
    await get({
      apiName: 'admin',
      path: `/scraper/sesiones/${exeId}`,
    }).response;
  },
}

export default SesionesService;
