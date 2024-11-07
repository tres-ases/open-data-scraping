import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {AsistenciaRawRepo, SesionRawListRepo, SesionRawRepo, VotacionRawListRepo} from "@senado-cl/global/repo";
import {CommonsData} from "@senado-cl/scraper-commons";
import {AsistenciaRaw, SesionRaw, VotacionRaw} from "@senado-cl/global/model";
import {AsistenciaResponse, SesionesResponse, VotacionesResponse} from "./sesiones.model";
import {asistenciaSc2AsistenciaRaw, sesionSc2SesionRaw, votacionSc2VotacionRaw} from "./sesiones.mapper";

const serviceName = 'SesionesExtractSaveRaw';
const logger = new Logger({
  logLevel: 'DEBUG',
  serviceName
});
const tracer = new Tracer({serviceName});

interface Event {
  legId: string
}

const SESIONES_URL = (legId: string) => `${CommonsData.SENADO_WEB_BACK_API}/sessions?limit=1000&id_legislatura=${legId}`;
const ASISTENCIA_URL = (sesId: number) => `${CommonsData.SENADO_WEB_BACK_API}/sessions/attendance?id_sesion=${sesId}`;
const VOTACION_URL = (sesId: number) => `${CommonsData.SENADO_WEB_BACK_API}/votes?id_sesion=${sesId}`;

const votacionRawListRepo = new VotacionRawListRepo();
const asistenciaRawRepo = new AsistenciaRawRepo();
const sesionRawRepo = new SesionRawRepo();
const sesionRawListRepo = new SesionRawListRepo();

export class ExtractSaveRaw implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler({legId}: Event, _context: any) {
    const dLogger = logger.createChild({
      persistentKeys: {legId}
    });
    const sesiones = await this.extractSesiones(legId);
    dLogger.debug('Sesiones obtenidas', {sesiones})
    await sesionRawListRepo.save(sesiones, {legId});

    for (const sesion of sesiones) {
      const sesId = sesion.id;
      dLogger.debug('Almacenando sesión, asistencia y votaciones', {sesId, sesion});
      await Promise.all([
        sesionRawRepo.save(sesion, {sesId}),
        sesion.asistencia ? asistenciaRawRepo.save(sesion.asistencia, {sesId}) : Promise.resolve(),
        sesion.votaciones ? votacionRawListRepo.save(sesion.votaciones, {sesId}) : Promise.resolve()
      ]);
    }
  }

  @tracer.captureMethod()
  public async extractVotacion(legId: string, sesId: number): Promise<VotacionRaw[]> {
    const dLogger = logger.createChild({
      persistentKeys: {legId, sesId}
    });
    const url = VOTACION_URL(sesId);
    dLogger.info('Obteniendo votaciones', {url})
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    const json: VotacionesResponse = await response.json();
    dLogger.info('Información obtenida', {json})
    if (json.data.total === 0) return [];
    return votacionSc2VotacionRaw(json.data.data);
  };

  @tracer.captureMethod()
  public async extractAsistencia(legId: string, sesId: number): Promise<AsistenciaRaw> {
    const dLogger = logger.createChild({
      persistentKeys: {legId, sesId}
    });
    const url = ASISTENCIA_URL(sesId);
    dLogger.info('Obteniendo asistencia', {url});
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    const json: AsistenciaResponse = await response.json();
    return asistenciaSc2AsistenciaRaw(json.data);
  }

  @tracer.captureMethod()
  public async extractSesiones(legId: string): Promise<SesionRaw[]> {
    const url = SESIONES_URL(legId);
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    const json: SesionesResponse = await response.json();
    const sesiones = sesionSc2SesionRaw(json.data.data);
    for (const sesion of sesiones) {
      const [asistencia, votaciones] = await Promise.all([this.extractAsistencia(legId, sesion.id), this.extractVotacion(legId, sesion.id)])
      sesion.asistencia = asistencia;
      sesion.votaciones = votaciones;
    }
    return sesiones;
  }
}

const instance = new ExtractSaveRaw();
export const handler = instance.handler.bind(instance);
