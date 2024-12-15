import {get} from 'aws-amplify/api';
import {SenadoresMapRaw, SenadorRaw} from "@odata-senado.cl/model";

const SenadorService = {
  getRaw: async (senSlug: number | string) => {
    try {
      const response = await get({
        apiName: 'admin',
        path: `/raw/senadores/${senSlug}`
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
