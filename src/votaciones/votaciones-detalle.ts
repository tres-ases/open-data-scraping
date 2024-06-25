import {getVotacionDetalle} from "./votaciones-detalle.service";
import {existsFile, readJson, saveJson} from "../utils.service";
import {Legislatura, SesionSala} from "../sesiones/sesiones.model";
import {BOLETINES_LIST_PATH, SESIONES_PATH, VOTACIONES_LIST_PATH} from "../config";
import {Votacion} from "./votaciones.model";
import {Resultados} from "../commons/commons.model";
import {ResultadosVotacionesDetalle} from "./votaciones-detalle.model";

(async () => {

  const legislaturas = await readJson<Legislatura[]>(SESIONES_PATH);

  const resultados: ResultadosVotacionesDetalle = {
    extracciones: {
      exitosas: 0,
      fallidas: 0
    },
    archivos: 0,
    boletinesError: []
  };

  let i=0;

  for (const l of legislaturas) {
    for (const ss of l.sesionesSala) {
      const votaciones = await readJson<Votacion[]>(`${VOTACIONES_LIST_PATH}/L${l.id}/SS${ss.id}.json`);

      for(const v of votaciones) {
        try {
          console.log('Legislatura', `(id:${l.id})`, l.description, 'Sesion Sala', `(id:${ss.id})`, ss.description, 'Votación', JSON.stringify(v));
          const filePath = `${BOLETINES_LIST_PATH}/L${l.id}/SS${ss.id}/${v.boletin}.json`;
          if (existsFile(filePath)) {
            console.log('Archivo ya existe');
            resultados.archivos++;
          }
          else {
            const vd = await getVotacionDetalle(v.boletin);
            if(vd === null) {
              resultados.boletinesError.push({
                legislatura: {
                  id: l.id, descripcion: l.description
                },
                sesionSala: {
                  id: ss.id, descripcion: ss.description
                },
                votacion: v
              });
              console.log('Boletín no válido');
            } else {
              //console.log('Votación Detalle', JSON.stringify(vd));
              saveJson(vd, filePath);
              resultados.extracciones.exitosas++;
              resultados.archivos++;
            }
          }
        } catch (err) {
          resultados.extracciones.fallidas++;
          console.error('Error al obtener las votaciones', err);
        }
      }
    }
  }

  console.info(' ');
  console.info('---');
  console.info('Proceso de Extracción Finalizado');
  console.info('Descargas exitosas:  ', resultados.extracciones.exitosas);
  console.info('Descargas fallidas:  ', resultados.extracciones.fallidas);
  console.info('Archivos:            ', resultados.archivos);
  console.info('Boletines con error: ', resultados.boletinesError.length);
  console.info('---');

  if(resultados.boletinesError.length > 0)
  saveJson(resultados.boletinesError, `${BOLETINES_LIST_PATH}/boletines_error.json`);

})();
