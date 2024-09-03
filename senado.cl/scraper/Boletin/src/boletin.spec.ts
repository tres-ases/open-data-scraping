import {getBoletin} from "./boletin.service";

describe('Obtener información boletines', () => {

  test('Boletin n° 16504', async () => {
    const result = await getBoletin('16504');
    expect(result).toBeDefined();
    expect(result.proyecto.length).toEqual(1);
    expect(result.proyecto[0].tramitaciones.length).toEqual(35);
    expect(result.proyecto[0].indicaciones.length).toEqual(1);
    expect(result.proyecto[0].materias.length).toEqual(0);
  });

  test('Boletin n° 12465 - Ley de Pesca - Agravar penas', async () => {
    const result = await getBoletin('12465');
    expect(result).toBeDefined();
    expect(result.proyecto.length).toEqual(1);
    expect(result.proyecto[0].tramitaciones.length).toEqual(23);
    expect(result.proyecto[0].indicaciones.length).toEqual(0);
    expect(result.proyecto[0].materias.length).toEqual(2);
  });
});