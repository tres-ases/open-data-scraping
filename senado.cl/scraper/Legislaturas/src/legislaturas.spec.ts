import {getLegislaturas} from "./legislaturas.service";

describe('Descargar listado legislaturas', () => {

  test('Listado completo', async () => {
    const result = await getLegislaturas();
    expect(result.data).toBeDefined();
    expect(result.data.length).toBeGreaterThanOrEqual(54);
    expect(result.status).toEqual('ok');
    expect(result.results).toEqual(1);
    const tipos = result.data.reduce((acc, curr) => acc.add(curr.TIPO), new Set());
    expect(tipos.size).toEqual(3);
  });
});
