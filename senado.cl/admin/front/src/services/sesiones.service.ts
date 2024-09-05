import {get, post} from 'aws-amplify/api';
import {Sesion} from "@senado-cl/global/sesiones";

const SesionesService = {
  getAll: async (legId: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/raw/legislaturas/${legId}/sesiones`
    }).response;
    return JSON.parse(await response.body.text()) as Sesion[];
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
