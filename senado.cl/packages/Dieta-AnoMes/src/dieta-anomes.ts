import {Handler} from 'aws-lambda';
import {getAnos, saveJsonLines, saveJsonStructured} from "./dieta-anomes.service";
import {Ano} from "@senado-cl/commons/dieta/model";

export const getAnosHandler: Handler<undefined> = async (event) => {
  try {
    const anos = await getAnos();
    console.log('anos', anos);
    return anos;
  } catch (err) {
    console.log(err);
    return "ERROR"
  }
};

export const saveAnosJsonStructured: Handler<Ano[]> = async (event) => {
  try {
    await saveJsonStructured(event);
    return;
  } catch (err) {
    console.log(err);
    return "ERROR"
  }
};

export const saveAnosJsonLines: Handler<Ano[]> = async (event) => {
  try {
    await saveJsonLines(event);
    return;
  } catch (err) {
    console.log(err);
    return "ERROR"
  }
};
