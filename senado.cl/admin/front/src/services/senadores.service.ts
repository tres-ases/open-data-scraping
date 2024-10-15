import {get} from 'aws-amplify/api';
import {SenadoresMapRaw, SenadorRaw} from "@senado-cl/global/model";

const SenadorService = {
  getRaw: async (senId: number | string) => {
    try {
      const response = await get({
        apiName: 'admin',
        path: `/raw/senadores/${senId}`
      }).response;
      return JSON.parse(await response.body.text()) as SenadorRaw;
    } catch (error) {
      return null;
    }
  },

  getRawMap: async () => {
    try {
      const response = await get({
        apiName: 'admin',
        path: '/raw/senadores'
      }).response;
      return JSON.parse(await response.body.text()) as SenadoresMapRaw;
    } catch (error) {
      return null;
    }
  },
}

export default SenadorService;
