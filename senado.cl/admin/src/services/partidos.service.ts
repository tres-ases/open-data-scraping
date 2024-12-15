import {get} from 'aws-amplify/api';
import {PartidosMapDtl} from "@odata-senado.cl/model";

const PartidosService = {
  getDtlMap: async () => {
    try {
      const response = await get({
        apiName: 'admin',
        path: '/dtl/partidos'
      }).response;
      return JSON.parse(await response.body.text()) as PartidosMapDtl;
    } catch (error) {
      return null;
    }
  },
}

export default PartidosService;
