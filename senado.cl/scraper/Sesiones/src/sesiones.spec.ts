import {ExtractSaveRaw} from "./sesiones-extractSaveRaw";

describe('Descargar listado sesiones', () => {

  test('Listado completo para legislatura id:503', async () => {
    const instance = new ExtractSaveRaw();
    const result = await instance.extractSesiones('503');
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThanOrEqual(106);
    const sesionTipos = result.reduce((acc, curr) => acc.add(curr.tipo), new Set());
    expect(sesionTipos.size).toEqual(4);
    const asistenciaValores = new Set();
    for(const r of result){
      if(r.asistencia) {
        for(const d of r.asistencia.detalle){
          asistenciaValores.add(d.asistencia);
        }
      }
    }
    expect(asistenciaValores.size).toEqual(2);
  }, 120_000);
});
