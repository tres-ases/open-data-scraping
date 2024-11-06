import {PartidosMapDtlRepo, SenadorRawRepo} from "@senado-cl/global/repo";
import {Logger} from "@aws-lambda-powertools/logger";
import {PartidosMapDtl} from "@senado-cl/global/model";

const partidosMapDtlRepo = new PartidosMapDtlRepo();
const senadorRawRepo = new SenadorRawRepo();

const logger = new Logger();

export const distillMap = async (senSlug: string) => {
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
