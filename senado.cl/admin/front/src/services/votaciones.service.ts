import {get} from 'aws-amplify/api';
import {VotacionRaw} from "@senado-cl/global/sesiones";

const VotacionService = {
  getRawList: async (sesId: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/raw/sesiones/${sesId}/votaciones`
    }).response;
    return JSON.parse(await response.body.text()) as VotacionRaw[];
  },
}

export default VotacionService;
