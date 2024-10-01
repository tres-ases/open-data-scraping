import {get, post} from 'aws-amplify/api';
import {LegislaturaSesionDtl, SesionRaw} from "@senado-cl/global/sesiones";

const startExtraction = async (legId: string | number) => {
  const response = await post({
    apiName: 'admin',
    path: '/scraper/sesiones',
    options: {
      queryParams: {legId: `${legId}`}
    }
  }).response;
  return JSON.parse(await response.body.text()) as { executionId: string };
}

const extractionStatus = async (exeId: string) => {
  const response = await get({
    apiName: 'admin',
    path: `/scraper/sesiones/${exeId}`,
  }).response;
  return JSON.parse(await response.body.text()) as { status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' };
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SesionesService = {
  getRawList: async (legId: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/raw/legislaturas/${legId}/sesiones`
    }).response;
    return JSON.parse(await response.body.text()) as SesionRaw[];
  },

  getRaw: async (sesId: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/raw/sesiones/${sesId}`
    }).response;
    return JSON.parse(await response.body.text()) as SesionRaw;
  },

  getDtl: async (sesId: string) => {
    const response = await get({
      apiName: 'admin',
      path: `/dtl/sesiones/${sesId}`
    }).response;
    return JSON.parse(await response.body.text()) as LegislaturaSesionDtl;
  },

  extract: async (legId: string | number) => {
    const {executionId} = await startExtraction(legId);
    await delay(30000);
    let status = 'RUNNING';
    while(status === 'RUNNING') {
      await delay(10000);
      status = (await extractionStatus(executionId)).status;
    }
    if(status === 'FAILED') {
      throw new Error(`Execution failed: ${executionId}`);
    }
  },


}

export default SesionesService;
