import axios from "axios";
import {CommonsData} from "@senado-cl/scraper-commons";
import {AsistenciaResponse, SesionesResponse, VotacionesResponse} from "./sesiones.model";
import {AsistenciaRaw, SesionRaw, VotacionRaw} from "@senado-cl/global/model";
import {AsistenciaRawRepo, SesionRawListRepo, SesionRawRepo, VotacionRawListRepo} from "@senado-cl/global/repo";
import {asistenciaSc2AsistenciaRaw, sesionSc2SesionRaw, votacionSc2VotacionRaw} from "./sesiones.mapper";

const SESIONES_URL = `${CommonsData.SENADO_WEB_BACK_API}/sessions`;
const ASISTENCIA_URL = `${CommonsData.SENADO_WEB_BACK_API}/sessions/attendance`;
const VOTACION_URL = `${CommonsData.SENADO_WEB_BACK_API}/votes`;

const votacionRawListRepo = new VotacionRawListRepo();
const asistenciaRawRepo = new AsistenciaRawRepo();
const sesionRawRepo = new SesionRawRepo();
const sesionRawListRepo = new SesionRawListRepo();

axios.defaults.timeout = 5000;

export const getVotaciones = async (sesId: number): Promise<VotacionRaw[]> => {
  const response = await axios.get<VotacionesResponse>(VOTACION_URL, {
    params: {
      id_sesion: sesId
    }
  });
  if(response.data.data.total === 0) return []
  return votacionSc2VotacionRaw(response.data.data.data);
};

export const getAsistencia = async (sesId: number): Promise<AsistenciaRaw> => {
  const response = await axios.get<AsistenciaResponse>(ASISTENCIA_URL, {
    params: {
      id_sesion: sesId
    }
  });
  return asistenciaSc2AsistenciaRaw(response.data.data);
}

export const getSesiones = async (legId: string): Promise<SesionRaw[]> => {
  const response = await axios.get<SesionesResponse>(SESIONES_URL, {
    params: {
      limit: 1000,
      id_legislatura: legId
    }
  });
  const sesiones = sesionSc2SesionRaw(response.data.data.data);
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

export const getSaveSesiones = async (legId: string) => {
  await saveSesiones(legId, await getSesiones(legId));
}
