import {get} from 'aws-amplify/api';
import {ProyectoRaw, ProyectosMapRaw} from "@senado-cl/global/model";

const ProyectosService = {
  getRaw: async (bolId: number | string) => {
    try {
      const response = await get({
        apiName: 'admin',
        path: `/raw/proyectos/${bolId}`
      }).response;
      return JSON.parse(await response.body.text()) as ProyectoRaw;
    } catch (error) {
      return null;
    }
  },

  getRawMap: async () => {
    try {
      const response = await get({
        apiName: 'admin',
        path: '/raw/proyectos'
      }).response;
      return JSON.parse(await response.body.text()) as ProyectosMapRaw;
    } catch (error) {
      return null;
    }
  },
}

export default ProyectosService;
