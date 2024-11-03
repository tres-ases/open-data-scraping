import {ProyectoDtl, ProyectoRaw} from "@senado-cl/global/model";

export const proyectoRaw2ProyectoDtl: (raw: ProyectoRaw) => ProyectoDtl = ({
                                                                             descripcion: {
                                                                               boletin,
                                                                               titulo,
                                                                               fechaIngreso,
                                                                               iniciativa,
                                                                               camaraOrigen,
                                                                               urgenciaActual,
                                                                               etapa,
                                                                               subEtapa,
                                                                               leyNumero,
                                                                               diarioOficial,
                                                                               estado
                                                                             },
                                                                             autores,
                                                                             tramitaciones,
                                                                             votaciones,
                                                                             urgencias,
                                                                             informes,
                                                                             comparados,
                                                                             oficios,
                                                                             indicaciones,
                                                                             observaciones,
                                                                             materias
                                                                           }) => {
  return {
    boletin,
    titulo,
    fechaIngreso,
    iniciativa,
    camaraOrigen,
    urgenciaActual,
    etapa,
    subEtapa,
    leyNumero,
    diarioOficial,
    estado,
    resumen: {
      autores: autores ? autores.length : 0,
      tramitaciones: tramitaciones ? tramitaciones.length : 0,
      votaciones: votaciones ? votaciones.length : 0,
      urgencias: urgencias ? urgencias.length : 0,
      informes: informes ? informes.length : 0,
      comparados: comparados ? comparados.length : 0,
      oficios: oficios ? oficios.length : 0,
      indicaciones: indicaciones ? indicaciones.length : 0,
      observaciones: observaciones ? observaciones.length : 0,
    },
    materias,
  }
}
