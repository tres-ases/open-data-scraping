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
import {Asistencia, Sesion, SesionesBucketKey, Votacion, VotacionDetalle} from "@senado-cl/global/sesiones";
import {MainBucketKey} from "@senado-cl/global";
import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";

const SESIONES_URL = `${CommonsData.SENADO_WEB_BACK}/sessions`;
const ASISTENCIA_URL = `${CommonsData.SENADO_WEB_BACK}/sessions/attendance`;
const VOTACION_URL = `${CommonsData.SENADO_WEB_BACK}/votes`;

const s3Client = new S3Client({});

export const getVotaciones = async (sesId: number): Promise<Votacion[]> => {
  const response = await axios.get<VotacionesResponse>(VOTACION_URL, {
    params: {
      id_sesion: sesId
    }
  });
  if(response.data.data.total === 0) return []
  return transformVotaciones(response.data.data.data);
};

const transformVotacionDetalles = (detalles: VotoDetalleSc[] | 0): 0 | VotacionDetalle[] => {
  return detalles === 0 ? 0 : detalles.map(d => ({
    uuid: d.UUID,
    parlId: d.PARLID,
    parSlug: d.SLUG,
    parNombre: d.NOMBRE,
    parApellidoPaterno: d.APELLIDO_PATERNO,
    parApellidoMaterno: d.APELLIDO_MATERNO,
  }))
};

const transformVotaciones = (votaciones: VotacionSc[]): Votacion[] => {
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

export const saveVotaciones = async (sesId: number, votaciones: Votacion[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: MainBucketKey.S3_BUCKET,
    Key: SesionesBucketKey.asistenciaJson(sesId),
    Body: JSON.stringify(votaciones)
  }))
  return votaciones;
};

export const getSaveVotaciones = async (sesId: number): Promise<Votacion[]> => {
  return await saveVotaciones(sesId, await getVotaciones(sesId));
}

export const getAsistencia = async (sesId: number): Promise<Asistencia> => {
  const response = await axios.get<AsistenciaResponse>(ASISTENCIA_URL, {
    params: {
      id_sesion: sesId
    }
  });
  return transformAsistencia(response.data.data);
}

const transformAsistencia = (a: AsistenciaSc): Asistencia => {
  return {
    sesId: a.ID_SESION,
    sesNumero: a.NUMERO_SESION,
    totalSenadores: a.TOTAL_SENADORES,
    totalSesiones: a.TOTAL_SESIONES,
    inicio: a.FECHA_HORA_INICIO,
    termino: a.FECHA_HORA_TERMINO,
    detalle: a.DATA.map(d => ({
      sesId: d.ID_SESION,
      sesNumero: d.NUMERO_SESION,
      parId: d.ID_PARLAMENTARIO,
      parNombre: d.NOMBRE,
      parApellidoPaterno: d.APELLIDO_PATERNO,
      parApellidoMaterno: d.APELLIDO_MATERNO,
      slug: d.SLUG,
      asistencia: d.ASISTENCIA,
      justificacion: d.JUSTIFICACION,
    })),
  };
}

export const saveAsistencia = async (sesId: number, asistencia: Asistencia) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: MainBucketKey.S3_BUCKET,
    Key: SesionesBucketKey.asistenciaJson(sesId),
    Body: JSON.stringify(asistencia)
  }))
  return asistencia;
};

export const getSaveAsistencia = async (sesId: number): Promise<Asistencia> => {
  return await saveAsistencia(sesId, await getAsistencia(sesId));
}

export const getSesiones = async (legId: string): Promise<Sesion[]> => {
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

export const saveSesiones = async (legId: string, sesiones: Sesion[]) => {
  await s3Client.send(new PutObjectCommand({
    Bucket: MainBucketKey.S3_BUCKET,
    Key: SesionesBucketKey.json(legId),
    Body: JSON.stringify(sesiones)
  }));

  for(const sesion of sesiones) {
    await Promise.all([
      sesion.asistencia ? saveAsistencia(sesion.id, sesion.asistencia) : Promise.resolve(),
      sesion.votaciones ? saveVotaciones(sesion.id, sesion.votaciones) : Promise.resolve()
    ]);
  }
};

const transformSesiones = (sesiones: SesionSc[]): Sesion[] => {
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