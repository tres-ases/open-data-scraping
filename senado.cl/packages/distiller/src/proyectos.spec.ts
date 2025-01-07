import {Xml2Json} from "./proyectos-xml2json";
import axios from "axios";

describe('Obtener información boletines', () => {
  test('Boletin n° 12465 - Ley de Pesca - Agravar penas', async () => {
    const response = await axios.get('https://tramitacion.senado.cl/wspublico/tramitacion.php?boletin=12465');

    const instance = new Xml2Json();
    console.log(response.data);

    const result = await instance.transform(response.data);

    expect(result).toBeDefined();
    expect(result.tramitaciones.length).toEqual(23);
    expect(result.indicaciones.length).toEqual(0);
    expect(result.materias.length).toEqual(2);
  });
});
