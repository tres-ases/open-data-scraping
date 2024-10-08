import {Logger} from '@aws-lambda-powertools/logger';
import {SenadorMapRaw, SenadorRaw, VotacionDetalleRaw} from "@senado-cl/global/model";
import {SenadorImgRepo, SenadorMapRawRepo, SenadorRawRepo, SesionRawListRepo} from "@senado-cl/global/repo";
import {CommonsData} from "@senado-cl/scraper-commons";
import axios from "axios";
import {SenadorResponse} from "./senador.model";
import {parliamentarianSenadoData2SenadorRaw} from "./senador.mapper";

const token = 'PoRBxBbd0fniUwg-GS0bp';
const SENADOR_URL = (slug: string) => `${CommonsData.SENADO_WEB}/_next/data/${token}/senadoras-y-senadores/listado-de-senadoras-y-senadores/${slug}.json`;

const logger = new Logger();

const senadorMapRawRepo = new SenadorMapRawRepo();
const senadorRawRepo = new SenadorRawRepo();
const senadorImgRepo = new SenadorImgRepo();
const sesionRawListRepo = new SesionRawListRepo();

export const getSenador = async (slug: string) => {
  const response = await axios.get<SenadorResponse>(SENADOR_URL(slug));
  return transform(response.data);
};

export const transform = (response: SenadorResponse): SenadorRaw => {
  return parliamentarianSenadoData2SenadorRaw(response.pageProps.resource.data.parliamentarianSenadoData);
};

export const saveSenador = async (senador: SenadorRaw) => {
  await Promise.all([
    senadorRawRepo.save(senador, {senId: senador.id}),
    getSaveSenImg(senador.id, senador.imagen.path),
    getSaveSenImg(senador.id, senador.imagen.path120, '120'),
    getSaveSenImg(senador.id, senador.imagen.path450, '450'),
    getSaveSenImg(senador.id, senador.imagen.path600, '600'),
  ]);
  return senador;
};

export const getSaveSenador = async (slug: string) => {
  return await saveSenador(await getSenador(slug));
}

const getSaveSenImg = async (senId: string | number, imageUrl: string, tipo?: string) => {
  try {
    const response = await axios.get(imageUrl, {responseType: 'stream'});
    await senadorImgRepo.save(response.data, {senId, tipo})
  } catch (error) {
    throw error; // Puedes manejar el error aquí o dejar que se propague
  }
}

export const detectNewSlugs = async (legId: string) => {
  try {
    let [sesiones, senadoresExistentes] = await Promise.all([
      sesionRawListRepo.getBy({legId}),
      senadorMapRawRepo.get()
    ]);

    if(senadoresExistentes === null) senadoresExistentes = {};

    if(sesiones) {
      const senadoresNuevos: SenadorMapRaw = {};
      for (const sesion of sesiones) {
        if(sesion.votaciones) {
          for (const votacion of sesion.votaciones) {
            const votos: VotacionDetalleRaw[] = [];
            if(votacion.detalle.si) votos.push(...votacion.detalle.si);
            if(votacion.detalle.no) votos.push(...votacion.detalle.no);
            if(votacion.detalle.abstencion) votos.push(...votacion.detalle.abstencion);
            if(votacion.detalle.pareo) votos.push(...votacion.detalle.pareo);
            for (const senador of votos) {
              if(senadoresExistentes[senador.parSlug] === undefined) {
                senadoresExistentes[senador.parSlug] = {
                  uuid: senador.uuid,
                  parlId: senador.parlId,
                  parNombre: senador.parNombre,
                  parApellidoPaterno: senador.parApellidoPaterno,
                  parApellidoMaterno: senador.parApellidoMaterno,
                };
                senadoresNuevos[senador.parSlug] = senadoresExistentes[senador.parSlug];
              }
            }
          }
        }
      }
      return Object.keys(senadoresNuevos);
    }
  } catch (error) {
    logger.error('Error al obtener listado de slugs no descargados');
  }
  return [] as string[];
}
