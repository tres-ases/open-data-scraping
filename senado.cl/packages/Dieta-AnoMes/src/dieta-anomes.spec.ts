import {getAnos} from "./dieta-anomes.service";

test('Extracción Ano 2023 - Meses', async () => {
  const response = await getAnos('2023');
  //console.log(JSON.stringify(response));
  expect(response.length).toBeGreaterThan(0);
});
