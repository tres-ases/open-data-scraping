import {AsistenciaSc, SesionSc, VotacionSc, VotoDetalleSc} from "./sesiones.model";
import {AsistenciaRaw, SesionRaw, VotacionDetalleRaw, VotacionRaw} from "@senado-cl/global/model";

export function votoDetalleSc2VotacionDetalleRaw(detalles: VotoDetalleSc[] | 0): 0 | VotacionDetalleRaw[] {
  return detalles === 0 ? 0 : detalles.map(d => ({
    uuid: d.UUID,
    parlId: d.PARLID,
    parSlug: d.SLUG,
    parNombre: d.NOMBRE,
    parApellidoPaterno: d.APELLIDO_PATERNO,
    parApellidoMaterno: d.APELLIDO_MATERNO,
  }))
};

export function votacionSc2VotacionRaw(votaciones: VotacionSc[]): VotacionRaw[] {
  return votaciones.map(v => ({
    id: v.ID_VOTACION,
    sesId: v.ID_SESION,
    sesNumero: v.NUMERO_SESION,
    fecha: v.FECHA_VOTACION,
    hora: v.HORA,
    tema: v.TEMA,
    quorum: v.QUORUM,
    boletin: v.BOLETIN,
    resultado: {
      si: v.SI,
      no: v.NO,
      abs: v.ABS,
      pareo: v.PAREO,
    },
    detalle: {
      si: votoDetalleSc2VotacionDetalleRaw(v.VOTACIONES.SI),
      no: votoDetalleSc2VotacionDetalleRaw(v.VOTACIONES.NO),
      abstencion: votoDetalleSc2VotacionDetalleRaw(v.VOTACIONES.ABSTENCION),
      pareo: votoDetalleSc2VotacionDetalleRaw(v.VOTACIONES.PAREO),
    }
  }));
};

export function asistenciaSc2AsistenciaRaw(a: AsistenciaSc): AsistenciaRaw {
  return {
    sesId: a.ID_SESION,
    sesNumero: a.NUMERO_SESION,
    totalSenadores: a.TOTAL_SENADORES,
    totalSesiones: a.TOTAL_SESIONES,
    inicio: a.FECHA_HORA_INICIO,
    termino: a.FECHA_HORA_TERMINO,
    detalle: a.DATA ? a.DATA.map(d => ({
      sesId: d.ID_SESION,
      sesNumero: d.NUMERO_SESION,
      parId: d.ID_PARLAMENTARIO,
      parNombre: d.NOMBRE,
      parApellidoPaterno: d.APELLIDO_PATERNO,
      parApellidoMaterno: d.APELLIDO_MATERNO,
      slug: d.SLUG,
      asistencia: d.ASISTENCIA,
      justificacion: d.JUSTIFICACION,
    })) : [],
  };
}

export function sesionSc2SesionRaw(sesiones: SesionSc[]): SesionRaw[] {
  return sesiones.map(s => ({
    id: s.ID_SESION,
    numero: s.NRO_SESION,
    legNumero: s.NRO_LEGISLATURA,
    legId: s.ID_LEGISLATURA,
    fecha: s.FECHA,
    horaInicio: s.HORA_INICIO,
    horaTermino: s.HORA_TERMINO,
    tipo: s.TIPO_SESION,
    cuenta: s.CUENTA
  }));
}
