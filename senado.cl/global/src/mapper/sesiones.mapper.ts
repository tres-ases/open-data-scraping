import {AsistenciaRaw, LegislaturaAsistenciaDtl, LegislaturaSesionDtl, LegislaturaVotacionDtl, SesionRaw, VotacionRaw} from "../model";

const asistenciaRaw2LegislaturaAsistenciaDtl = (raw?: AsistenciaRaw): LegislaturaAsistenciaDtl | undefined => raw ? ({
  totalSenadores: raw.totalSenadores,
  totalSesiones: raw.totalSesiones,
  inicio: raw.inicio,
  termino: raw.termino,
  resumen: raw.detalle.reduce((acc, curr) => {
    if (curr.asistencia === 'Asiste') acc.asistentes++;
    else if (curr.asistencia === 'Ausente' && curr.justificacion === null) acc.inasistentes.injustificados++;
    else acc.inasistentes.justificados++;
    return acc;
  }, {
    asistentes: 0,
    inasistentes: {
      justificados: 0,
      injustificados: 0,
    }
  })
}) : undefined;

const votacionRaw2LegislaturaVotacionDtl = (rawList?: VotacionRaw[]): LegislaturaVotacionDtl[] | undefined => rawList ? rawList.map(
  raw => ({
    fecha: raw.fecha,
    hora: raw.hora,
    tema: raw.tema,
    quorum: raw.quorum,
    boletin: raw.boletin,
    resultado: {
      si: raw.resultado.si,
      no: raw.resultado.no,
      abs: raw.resultado.abs,
      pareo: raw.resultado.pareo,
    }
  })
) : undefined;

export const SesionesMapper = {
  sesionRaw2LegislaturaSesionDtl: (raw: SesionRaw): LegislaturaSesionDtl => ({
    id: raw.id,
    numero: raw.numero,
    legNumero: raw.legNumero,
    legId: raw.legId,
    fecha: raw.fecha,
    horaInicio: raw.horaInicio,
    horaTermino: raw.horaTermino,
    tipo: raw.tipo,
    cuenta: raw.cuenta,
    asistencia: asistenciaRaw2LegislaturaAsistenciaDtl(raw.asistencia),
    votaciones: votacionRaw2LegislaturaVotacionDtl(raw.votaciones)
  })
}
