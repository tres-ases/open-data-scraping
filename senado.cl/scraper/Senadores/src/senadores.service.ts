import {Logger} from '@aws-lambda-powertools/logger';
import {SendMessageCommand, SQSClient} from '@aws-sdk/client-sqs';
import {SenadoresMapRaw, SenadorRaw, VotacionDetalleRaw} from "@senado-cl/global/model";
import {SenadorImgRepo, SenadorMapRawRepo, SenadorRawRepo, SesionRawListRepo} from "@senado-cl/global/repo";
import {CommonsData} from "@senado-cl/scraper-commons";
import axios from "axios";
import {SenadorResponse} from "./senadores.model";
import {parliamentarianSenadoData2SenadorRaw} from "./senadores.mapper";

const token = 'GkTQim2_3oBCgZvYsnznZ';
const SENADOR_URL = (slug: string) => `${CommonsData.SENADO_WEB}/_next/data/${token}/senadoras-y-senadores/listado-de-senadoras-y-senadores/${slug}.json`;
const SENADOR_IMG_URL = (uuid: string, slug: string) => `${CommonsData.SENADO_WEB}/_next/image?url=https://cdn.senado.cl/portal-senado-produccion/public/parlamentarios/${uuid}/${slug}_600x600.jpg&w=1080&q=75`;

const logger = new Logger();
const sqsClient = new SQSClient({});

const senadorMapRawRepo = new SenadorMapRawRepo();
const senadorRawRepo = new SenadorRawRepo();
const senadorImgRepo = new SenadorImgRepo();
const sesionRawListRepo = new SesionRawListRepo();

axios.defaults.timeout = 5000

export const getSenador = async (slug: string) => {
  const dLogger = logger.createChild({
    persistentKeys: {slug}
  });
  const url = SENADOR_URL(slug);
  dLogger.info('Obteniendo información', {url});
  const response = await axios.get<SenadorResponse>(SENADOR_URL(slug));
  dLogger.debug('Información obtenida', {data: response.data});
  const senador = parliamentarianSenadoData2SenadorRaw(response.data.pageProps.resource.data.parliamentarianSenadoData);
  dLogger.info('Senador', {senador});
  return senador;
};

export const saveSenador = async (senador: SenadorRaw) => {
  await Promise.all([
    senadorRawRepo.save(senador, {senSlug: senador.slug}),
    getSaveSenImg(senador.uuid, senador.slug),
  ]);
  return senador;
};

export const getSaveSenador = async (slug: string) => {
  const dLogger = logger.createChild({
    persistentKeys: {slug}
  });
  dLogger.info('Ejecutando getSaveSenador', {slug});
  await saveSenador(await getSenador(slug));
  const params = {
    QueueUrl: process.env.PART_MAP_DISTILL_QUEUE_URL!,
    MessageBody: slug,
  };
  const command = new SendMessageCommand(params);
  dLogger.debug('SQS.SendMessageCommand', {params});
  return await sqsClient.send(command);
}

const getSaveSenImg = async (uuid: string, slug: string) => {
  const dLogger = logger.createChild({
    persistentKeys: {uuid, slug}
  });
  try {
    const imageUrl = SENADOR_IMG_URL(uuid, slug);
    dLogger.info("Obteniendo img src", {imageUrl});
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    await senadorImgRepo.save(Buffer.from(response.data), 'image/jpeg', {senSlug: slug, img: 'default.jpg'});
  } catch (error) {
    dLogger.error("Error al obtener la imagen", error);
  }
}

export const detectNewSlugs = async (legId: string) => {
  const dLogger = logger.createChild({
    persistentKeys: {legId}
  });
  try {
    const sesiones = await sesionRawListRepo.getBy({legId});
    let senadoresExistentes: SenadoresMapRaw;
    try {
      senadoresExistentes = await senadorMapRawRepo.get() ?? {};
    } catch (error) {
      dLogger.error('Error al obtener el listado de senadores', error);
      senadoresExistentes = {};
    }

    if (senadoresExistentes === null) senadoresExistentes = {};

    if (sesiones) {
      const senadoresNuevos = new Set<string>();
      for (const sesion of sesiones) {
        if (sesion.votaciones) {
          for (const votacion of sesion.votaciones) {
            const votos: VotacionDetalleRaw[] = [];
            if (votacion.detalle.si) votos.push(...votacion.detalle.si);
            if (votacion.detalle.no) votos.push(...votacion.detalle.no);
            if (votacion.detalle.abstencion) votos.push(...votacion.detalle.abstencion);
            if (votacion.detalle.pareo) votos.push(...votacion.detalle.pareo);
            for (const {parSlug, uuid, parlId, parNombre, parApellidoPaterno, parApellidoMaterno} of votos) {
              if (senadoresExistentes[parSlug] === undefined) {
                senadoresExistentes[parSlug] = {
                  uuid, parlId, parNombre, parApellidoPaterno, parApellidoMaterno,
                };
                senadoresNuevos.add(parSlug);
              }
            }
          }
        }
      }
      if (senadoresNuevos.size > 0) {
        await Promise.all(
          [...senadoresNuevos].map(slug => {
            const params = {
              QueueUrl: process.env.NEW_SEN_SLUGS_QUEUE_URL!,
              MessageBody: slug,
            };
            const command = new SendMessageCommand(params);
            return sqsClient.send(command);
          })
        );
        dLogger.info(`Cantidad de slugs nuevos detectados ${senadoresNuevos.size}`);
        dLogger.debug('Detalle slugs nuevos detectados', {slugs: senadoresNuevos});
        await senadorMapRawRepo.save(senadoresExistentes);
      } else {
        dLogger.info('No se detectaron slugs nuevos');
      }
      return senadoresNuevos;
    }
  } catch (error) {
    dLogger.error('Error al obtener listado de slugs no descargados', error);
  }
  return [] as string[];
}
