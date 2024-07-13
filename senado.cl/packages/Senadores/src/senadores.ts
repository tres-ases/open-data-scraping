import {getSaveSenadoresPeriodos} from "./senadores.service";
import {Handler} from "aws-lambda";


export const getSaveSenadoresPeriodosHandler: Handler = async () => {
  return getSaveSenadoresPeriodos();
};
