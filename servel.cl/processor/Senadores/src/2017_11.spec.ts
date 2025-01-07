import {processor} from "./2017_11";
import {expect} from "@jest/globals";

describe('Procesar votación noviembre 2017', () => {

  test('Circunscripciones senatoriales 11 y 15', async () => {
    const result = await processor('./data/2017_11_Senatorial_Datos_Eleccion.min.xlsx', './data/data.2017.min.json');
    console.log(JSON.stringify(result));
    expect(result).toBeDefined();
  }, 30_000);

  test('Todas las circunscripciones senatoriales', async () => {
    const result = await processor();
    console.log(JSON.stringify(result));
    expect(result).toBeDefined();
  }, 300_000);
});
