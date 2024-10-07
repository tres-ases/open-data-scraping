import {get} from 'aws-amplify/api';
import {AsistenciaRaw} from "@senado-cl/global/model";

const AsistenciaService = {
  getRaw: async (sesId: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/raw/sesiones/${sesId}/asistencia`
    }).response;
    return JSON.parse(await response.body.text()) as AsistenciaRaw;
  },
}

export default AsistenciaService;
