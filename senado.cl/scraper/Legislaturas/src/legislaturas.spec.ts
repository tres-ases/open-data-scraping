import {getLegislaturas} from "./legislaturas.service";

describe('Descargar listado legislaturas', () => {

  test('Listado completo', async () => {
    const result = await getLegislaturas();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(54);
    const tipos = result.reduce((acc, curr) => acc.add(curr.TIPO), new Set());
    expect(tipos.size).toEqual(3);
  });
});
