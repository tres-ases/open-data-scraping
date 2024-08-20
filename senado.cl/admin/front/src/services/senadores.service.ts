import { get } from 'aws-amplify/api';

const SenadoresService = {
  getAll: async () => {
    const response = await get({
      apiName: 'admin',
      path: 'senadores'
    }).response;
    return await response.body.text();
  }
}

export default SenadoresService;
