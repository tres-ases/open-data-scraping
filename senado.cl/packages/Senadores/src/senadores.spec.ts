import {getSenadoresPeriodos, Tipo} from "./senadores.service";

describe('Listado Senadores y Períodos', () => {

  test('Debe obtener la información', async () => {
    const result = await getSenadoresPeriodos(Tipo.ACTUALES);

    expect(result.length).toBeGreaterThanOrEqual(50);
  });
});
