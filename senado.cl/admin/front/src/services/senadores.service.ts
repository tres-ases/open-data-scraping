import { get } from 'aws-amplify/api';
import {ParlamentarioDetalle, PeriodoSenador} from "@senado-cl/global/senadores";

const SenadoresService = {
  getAll: async () => {
    const response = await get({
      apiName: 'admin',
      path: '/senadores'
    }).response;
    return JSON.parse(await response.body.text()) as PeriodoSenador[];
  },

  getOne: async (id: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/senadores/${id}`
    }).response;
    return JSON.parse(await response.body.text()) as ParlamentarioDetalle;
  }
}

export default SenadoresService;
