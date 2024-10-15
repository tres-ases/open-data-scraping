import {getProyecto} from "./proyectos.service";

describe('Obtener información boletines', () => {

  test('Boletin n° 16504', async () => {
    const result = await getProyecto('16504');
    console.log(JSON.stringify(result, null, 2));
    expect(result).toBeDefined();
    expect(result.proyecto.length).toEqual(1);
    expect(result.proyecto[0].tramitaciones.length).toEqual(37);
    expect(result.proyecto[0].indicaciones.length).toEqual(1);
    expect(result.proyecto[0].materias.length).toEqual(0);
  });

  test('Boletin n° 12465 - Ley de Pesca - Agravar penas', async () => {
    const result = await getProyecto('12465');
    expect(result).toBeDefined();
    expect(result.proyecto.length).toEqual(1);
    expect(result.proyecto[0].tramitaciones.length).toEqual(23);
    expect(result.proyecto[0].indicaciones.length).toEqual(0);
    expect(result.proyecto[0].materias.length).toEqual(2);
  });
});
