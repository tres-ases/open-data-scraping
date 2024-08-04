import {Handler} from 'aws-lambda';

export const hi: Handler = async () => {
  return {hola: 'mundo'};
}
