import { get } from 'aws-amplify/api';
import {PeriodoSenador} from "@senado-cl/global/senadores";

const SenadoresService = {
  getAll: async () => {
    const response = await get({
      apiName: 'admin',
      path: '/senadores'
    }).response;
    return JSON.parse(await response.body.text()) as PeriodoSenador[];
  }
}

export default SenadoresService;
