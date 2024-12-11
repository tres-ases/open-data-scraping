import {processor} from "./2021_11";
import {expect} from "@jest/globals";

describe('Procesar votación noviembre 2021', () => {

  test('Circunscripciones senatoriales 12 y 13', async () => {
    const result = await processor('./2021_11_Senadores_Datos_Eleccion.min.xlsx', './data.min.json');
    console.log(JSON.stringify(result));
    expect(result).toBeDefined();
  }, 30_000);

  test('Todas las circunscripciones senatoriales', async () => {
    const result = await processor();
    console.log(JSON.stringify(result));
    expect(result).toBeDefined();
  }, 300_000);
});
