import {Handler} from 'aws-lambda';
import {getAnos, getMeses} from "./dieta-anomes.service";

export const handler: Handler<undefined> = async (event, context) => {
  try {
    const anos = await getAnos();
    console.log('anos', anos);
    return anos;
  } catch (err) {
    console.log(err);
    return "ERROR"
  }
};
