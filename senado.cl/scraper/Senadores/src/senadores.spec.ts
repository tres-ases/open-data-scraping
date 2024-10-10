import {getSenador, getSenImgUrl,} from "./senadores.service";


describe('Obtener información senador', () => {

  test('Detalles senador Rojo Edwards Silva', async () => {
    const result = await getSenador('rojo-edwards-silva-sen');
    expect(result).toBeDefined();
  });

  test('Obtener URL imagen Loreto Carvajal', async () => {
    const src = await getSenImgUrl('loreto-carvajal-ambiado-sen');
    console.log(src);
  });
});
