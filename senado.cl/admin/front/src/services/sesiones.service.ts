import {get, post} from 'aws-amplify/api';
import {Legislatura} from "@senado-cl/global/legislaturas";

const SesionesService = {
  getAll: async (legId: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/legislaturas/${legId}/sesiones`
    }).response;
    return JSON.parse(await response.body.text()) as Legislatura[];
  },

  extract: async (legId: string) => {
    await post({
      apiName: 'admin',
      path: '/ejecuciones/sesiones',
      options: {
        queryParams: {legId}
      }
    }).response;
  },

  extractStatus: async (exeId: string) => {
    await get({
      apiName: 'admin',
      path: `/ejecuciones/sesiones/${exeId}`,
    }).response;
  },
}

export default SesionesService;
