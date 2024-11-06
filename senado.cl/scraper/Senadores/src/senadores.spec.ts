import {ExtractSaveRaw} from "./senadores.handler.extractSaveRaw";

describe('Obtener información senador', () => {

  test('Detalles senador Rojo Edwards Silva', async () => {
    const instance = new ExtractSaveRaw();
    const result = await instance.extract('rojo-edwards-silva-sen');
    expect(result).toBeDefined();
  });
});
