import {LegExtract} from "./legislaturas.handler.extract";

describe('Descargar listado legislaturas', () => {

  test('Listado completo', async () => {
    const instance = new LegExtract();
    const result = await instance.getList();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(54);
    const tipos = result.reduce((acc, curr) => acc.add(curr.tipo), new Set());
    expect(tipos.size).toEqual(3);
  });
});
