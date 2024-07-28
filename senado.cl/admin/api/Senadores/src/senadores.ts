import {Handler} from 'aws-lambda';

export const getAnosHandler: Handler = async () => {
  return {hola: 'mundo'};
}
