import axios from "axios";
import {CommonsData} from "@senado-cl/scraper-commons";
import {
  AsistenciaResponse,
  AsistenciaSc,
  SesionesResponse,
  SesionSc,
  VotacionesResponse,
  VotacionSc,
  VotoDetalleSc
} from "./sesiones.model";
import {AsistenciaRaw, SesionRaw, VotacionDetalleRaw, VotacionRaw} from "@senado-cl/global/model";
import {AsistenciaRawRepo, SesionRawListRepo, SesionRawRepo, VotacionRawListRepo} from "@senado-cl/global/repo";

const SESIONES_URL = `${CommonsData.SENADO_WEB_BACK_API}/sessions`;
const ASISTENCIA_URL = `${CommonsData.SENADO_WEB_BACK_API}/sessions/attendance`;
const VOTACION_URL = `${CommonsData.SENADO_WEB_BACK_API}/votes`;

const votacionRawListRepo = new VotacionRawListRepo();
const asistenciaRawRepo = new AsistenciaRawRepo();
const sesionRawRepo = new SesionRawRepo();
const sesionRawListRepo = new SesionRawListRepo();

export const getVotaciones = async (sesId: number): Promise<VotacionRaw[]> => {
  const response = await axios.get<VotacionesResponse>(VOTACION_URL, {
    params: {
      id_sesion: sesId
    }
  });
  if(response.data.data.total === 0) return []
  return transformVotaciones(response.data.data.data);
};

const transformVotacionDetalles = (detalles: VotoDetalleSc[] | 0): 0 | VotacionDetalleRaw[] => {
  return detalles === 0 ? 0 : detalles.map(d => ({
    uuid: d.UUID,
    parlId: d.PARLID,
    parSlug: d.SLUG,
    parNombre: d.NOMBRE,
    parApellidoPaterno: d.APELLIDO_PATERNO,
    parApellidoMaterno: d.APELLIDO_MATERNO,
  }))
};

const transformVotaciones = (votaciones: VotacionSc[]): VotacionRaw[] => {
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
      si: transformVotacionDetalles(v.VOTACIONES.SI),
      no: transformVotacionDetalles(v.VOTACIONES.NO),
      abstencion: transformVotacionDetalles(v.VOTACIONES.ABSTENCION),
      pareo: transformVotacionDetalles(v.VOTACIONES.PAREO),
    }
  }));
};

export const getAsistencia = async (sesId: number): Promise<AsistenciaRaw> => {
  const response = await axios.get<AsistenciaResponse>(ASISTENCIA_URL, {
    params: {
      id_sesion: sesId
    }
  });
  return transformAsistencia(response.data.data);
}

const transformAsistencia = (a: AsistenciaSc): AsistenciaRaw => {
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

export const getSesiones = async (legId: string): Promise<SesionRaw[]> => {
  const response = await axios.get<SesionesResponse>(SESIONES_URL, {
    params: {
      limit: 1000,
      id_legislatura: legId
    }
  });
  const sesiones = transformSesiones(response.data.data.data);
  for(const sesion of sesiones) {
    const [asistencia, votaciones] = await Promise.all([getAsistencia(sesion.id), getVotaciones(sesion.id)])
    sesion.asistencia = asistencia;
    sesion.votaciones = votaciones;
  }
  return sesiones;
}

export const saveSesiones = async (legId: string, sesiones: SesionRaw[]) => {
  await sesionRawListRepo.save(sesiones, {legId});

  for(const sesion of sesiones) {
    const sesId = sesion.id;
    await Promise.all([
      sesionRawRepo.save(sesion, {sesId}),
      sesion.asistencia ? asistenciaRawRepo.save(sesion.asistencia, {sesId}) : Promise.resolve(),
      sesion.votaciones ? votacionRawListRepo.save(sesion.votaciones, {sesId}) : Promise.resolve()
    ]);
  }
};

const transformSesiones = (sesiones: SesionSc[]): SesionRaw[] => {
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

export const getSaveSesiones = async (legId: string) => {
  await saveSesiones(legId, await getSesiones(legId));
}
