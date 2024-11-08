import {ExtractSaveRawFromQueue} from "./senadores-extractSaveRawFromQueue";

describe('Obtener información senador', () => {

  test('Detalles senador Matías Walker Prieto', async () => {
    const slug = 'matias-walker-prieto-sen'; //const slug = 'rojo-edwards-silva-sen';
    const instance = new ExtractSaveRawFromQueue();
    const json = await instance.extractData(slug);
    const imageFileUrlMap = await instance.getImageFileUrlMapFromJson(slug, json)
    console.log(imageFileUrlMap);
    const senador = await instance.extractFromJson(slug, json);
    console.log(senador);
    expect(imageFileUrlMap).toBeDefined();
    expect(senador).toBeDefined();
  });
});
