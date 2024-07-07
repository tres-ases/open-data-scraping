import {Handler} from 'aws-lambda';
import {getAnos, getMeses} from "./dieta-anomes.service";

export const handler: Handler<undefined> = async (event, context) => {
  try {
    const anos = await getAnos();

    for (const a of anos) {
      a.meses = await getMeses(a);
    }

    console.log('anos', anos);
    return anos;
    //saveJson(anos, DIETA_ANO_MES_PATH);
  } catch (err) {
    console.log(err);
    return "ERROR"
  }
};
