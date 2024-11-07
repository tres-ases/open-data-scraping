import {Logger} from "@aws-lambda-powertools/logger";
import type {LambdaInterface} from "@aws-lambda-powertools/commons/types";
import {Tracer} from '@aws-lambda-powertools/tracer';
import {PartidosMapDtlRepo, SenadorRawRepo} from "@senado-cl/global/repo";
import {PartidosMapDtl} from "@senado-cl/global/model";
import {SQSEvent} from "aws-lambda/trigger/sqs";

const serviceName = 'PartidosDistillMap';
const logger = new Logger({
  logLevel: 'DEBUG',
  serviceName
});
const tracer = new Tracer({serviceName});

const partidosMapDtlRepo = new PartidosMapDtlRepo();
const senadorRawRepo = new SenadorRawRepo();

export class DistillMapFromQueue implements LambdaInterface {

  @tracer.captureLambdaHandler()
  public async handler({Records}: SQSEvent, _context: any) {
    logger.debug('Ejecutando DistillMapFromQueue.handler', {Records});
    for(const {body} of Records) {
      await this.distillMap(body);
    }
  }

  @tracer.captureMethod()
  public async distillMap(senSlug: string) {
    const dLogger = logger.createChild({
      persistentKeys: {senSlug}
    });
    const senador = await senadorRawRepo.getBy({senSlug});
    if (senador) {
      logger.info('Información senador obtenida', {senador})
      let partidosMap = await partidosMapDtlRepo.get();
      if (partidosMap === null) {
        partidosMap = {} as PartidosMapDtl;
        dLogger.info('partidosMapDtlRepo.get obtuvo resultado nulo');
      }
      dLogger.debug('partidosMapDtlRepo.get', {partidosMap});
      const partido = senador.partido;
      if (partidosMap[partido.id] === undefined) {
        partidosMap[partido.id] = {
          id: partido.id, nombre: partido.nombre, senadores: []
        };
      }
      //borramos al senador de todos los partidos, en caso de que se haya cambiado
      Object.values(partidosMap)
        .forEach(
          partido => {
            partido.senadores = partido.senadores.filter(senador => senador.slug !== senSlug);
          }
        );

      //pisamos la información del partido en caso de que haya sido actualizada
      partidosMap[partido.id] = {
        id: partido.id,
        nombre: partido.nombre,
        senadores: [...partidosMap[partido.id].senadores, {
          id: senador.id,
          slug: senador.slug,
          uuid: senador.uuid,
          sexo: senador.sexo,
          region: senador.region,
          nombreCompleto: senador.nombreCompleto
        }]
      };

      logger.debug('partidosMapDtlRepo.save', {partidosMap})
      await partidosMapDtlRepo.save(partidosMap);
    } else {
      dLogger.error("No se encontró la información de senadores (SenadorMapRaw)");
    }
  }
}

const instance = new DistillMapFromQueue();
export const handler = instance.handler.bind(instance);
