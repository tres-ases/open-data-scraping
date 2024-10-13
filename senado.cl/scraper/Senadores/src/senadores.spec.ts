import {getSenador} from "./senadores.service";


describe('Obtener información senador', () => {

  test('Detalles senador Rojo Edwards Silva', async () => {
    const result = await getSenador('rojo-edwards-silva-sen');
    expect(result).toBeDefined();
  });
});
