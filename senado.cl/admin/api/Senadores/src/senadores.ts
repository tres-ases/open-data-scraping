import {Handler} from 'aws-lambda';

export const getAnosHandler: Handler = () => {
  return {hola: 'mundo'};
}
