import {Logger} from '@aws-lambda-powertools/logger';
import {SendMessageCommand, SQSClient} from '@aws-sdk/client-sqs';
import * as cheerio from 'cheerio';
import {SenadorMapRaw, SenadorRaw, VotacionDetalleRaw} from "@senado-cl/global/model";
import {SenadorImgRepo, SenadorMapRawRepo, SenadorRawRepo, SesionRawListRepo} from "@senado-cl/global/repo";
import {CommonsData} from "@senado-cl/scraper-commons";
import axios from "axios";
import {SenadorResponse} from "./senadores.model";
import {parliamentarianSenadoData2SenadorRaw} from "./senadores.mapper";

const token = 'PoRBxBbd0fniUwg-GS0bp';
const SENADOR_URL = (slug: string) => `${CommonsData.SENADO_WEB}/_next/data/${token}/senadoras-y-senadores/listado-de-senadoras-y-senadores/${slug}.json`;
const SENADOR_IMG_URL = (slug: string) => `${CommonsData.SENADO_WEB}/senadoras-y-senadores/listado-de-senadoras-y-senadores/${slug}`;

const logger = new Logger();
const sqsClient = new SQSClient({});

const senadorMapRawRepo = new SenadorMapRawRepo();
const senadorRawRepo = new SenadorRawRepo();
const senadorImgRepo = new SenadorImgRepo();
const sesionRawListRepo = new SesionRawListRepo();

axios.defaults.timeout = 5000

export const getSenador = async (slug: string) => {
  logger.info(`Obteniendo información desde ${SENADOR_URL(slug)}`);
  const response = await axios.get<SenadorResponse>(SENADOR_URL(slug));
  logger.info(`Información obtenida`, JSON.stringify(response.data));
  const senador =  parliamentarianSenadoData2SenadorRaw(response.data.pageProps.resource.data.parliamentarianSenadoData);
  logger.info(`Senador`, JSON.stringify(senador));
  return senador;
};

export const saveSenador = async (senador: SenadorRaw) => {
  await Promise.all([
    senadorRawRepo.save(senador, {senId: senador.id}),
    getSaveSenImg(senador.id, senador.slug),
  ]);
  return senador;
};

export const getSaveSenador = async (slug: string) => {
  logger.info('Ejecutando getSaveSenador', slug);
  return await saveSenador(await getSenador(slug));
}

export const getSaveSenImg = async (senId: string | number, slug: string) => {
  try {
    const { data: html } = await axios.get(SENADOR_IMG_URL(slug));
    const $ = cheerio.load(html);

    const imageUrl = $('div.parlamentario-img > img').attr('src');
    if (!imageUrl) {
      logger.error(`No se encontró la imagen con el selector proporcionado para el slug '${slug}'`);
      return;
    }

    const response = await axios.get(new URL(imageUrl, CommonsData.SENADO_WEB).toString(), {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    await senadorImgRepo.save(Buffer.from(response.data), 'image/jpeg', {senId, img: 'default.jpg'});
  } catch (error) {
    logger.error(`Error al obtener la imagen para el slug ${slug}`, error);
  }
}

export const detectNewSlugs = async (legId: string) => {
  try {
    const sesiones = await sesionRawListRepo.getBy({legId});
    let senadoresExistentes: SenadorMapRaw;
    try {
      senadoresExistentes = await senadorMapRawRepo.get() ?? {};
    } catch (error) {
      logger.error('Error al obtener el listado de senadores', error);
      senadoresExistentes = {};
    }
    logger.debug(`[${typeof senadorMapRawRepo}] Valor obtenido: ${JSON.stringify(senadoresExistentes)}`);

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
      if(senadoresNuevos.size > 0) {
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
        logger.info(`Cantidad de slugs nuevos detectados ${senadoresNuevos.size}`);
        logger.debug(`Detalle slugs nuevos detectados: ${senadoresNuevos}`);
        await senadorMapRawRepo.save(senadoresExistentes);
      } else {
        logger.info('No se detectaron slugs nuevos');
      }
      return senadoresNuevos;
    }
  } catch (error) {
    logger.error('Error al obtener listado de slugs no descargados', error);
  }
  return [] as string[];
}
