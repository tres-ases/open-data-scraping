import {PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {Logger} from '@aws-lambda-powertools/logger';
import {MainBucketKey, SenadoresBucketKey} from "@senado-cl/global/config";
import {LegislaturaMapDtl, SenadorRaw, SenadorMapRaw} from "@senado-cl/global/model";
import {LegislaturaDtlRepo, SenadorMapRawRepo, SenadorRawRepo} from "@senado-cl/global/repo";
import {CommonsData} from "@senado-cl/scraper-commons";
import axios from "axios";
import {SenadorResponse} from "./senador.model";

const token = 'PoRBxBbd0fniUwg-GS0bp';
const SENADOR_URL = (slug: string) => `${CommonsData.SENADO_WEB}/_next/data/${token}/senadoras-y-senadores/listado-de-senadoras-y-senadores/${slug}.json`;
const s3Client = new S3Client({});

const logger = new Logger();

const legislaturaDtlRepo = new LegislaturaDtlRepo();
const senadorMapRawRepo = new SenadorMapRawRepo();
const senadorRawRepo = new SenadorRawRepo();

export const getSenador = async (slug: string) => {
  const response = await axios.get<SenadorResponse>(SENADOR_URL(slug));
  return transform(response.data);
};

export const transform = (response: SenadorResponse): SenadorRaw => {
  const senData = response.pageProps.resource.data.parliamentarianSenadoData;
  return {
    id: senData.data[0].ID_PARLAMENTARIO,
    uuid: senData.data[0].UUID,
    slug: senData.data[0].SLUG,
    nombreCompleto: senData.data[0].NOMBRE_COMPLETO,
    nombre: senData.data[0].NOMBRE,
    apellidoPaterno: senData.data[0].APELLIDO_PATERNO,
    apellidoMaterno: senData.data[0].APELLIDO_MATERNO,
    camara: senData.data[0].CAMARA,
    partido: {
      id: senData.data[0].PARTIDO_ID,
      nombre: senData.data[0].PARTIDO,
    },
    circunscripcionId: senData.data[0].CIRCUNSCRIPCION_ID,
    region: {
      id: senData.data[0].REGION_ID,
      nombre: senData.data[0].REGION,
    },
    comite: {
      id: senData.data[0].COMITE.ID,
      uuid: senData.data[0].COMITE.UUID,
      nombre: senData.data[0].COMITE.NOMBRE,
      abreviatura: senData.data[0].COMITE.ABREVIATURA,
    },
    fono: senData.data[0].FONO,
    email: senData.data[0].EMAIL,
    sexo: {
      valor: senData.data[0].SEXO,
      etiqueta: senData.data[0].SEXO_ETIQUETA,
      etiquetaAbreviatura: senData.data[0].SEXO_ETIQUETA_ABREVIATURA,
    },
    periodos: senData.data[0].PERIODOS.map(p => ({
      id: p.ID,
      uuid: p.UUID,
      camara: p.CAMARA,
      desde: p.DESDE,
      hasta: p.HASTA,
      vigente: p.VIGENTE
    })),
    imagen: {
      path: senData.data[0].IMAGEN,
      path120: senData.data[0].IMAGEN_120,
      path450: senData.data[0].IMAGEN_450,
      path600: senData.data[0].IMAGEN_600,
    },
    cargos: senData.CARGOS,
    enlaces: {
      facebookPagina: senData.ENLACES[0].FACEBOOK_PAGE,
      facebookCuenta: senData.ENLACES[0].FACEBOOK_CUENTA,
      twitter: senData.ENLACES[0].TWITTER,
      webPersonal: senData.ENLACES[0].WEB_PERSONAL,
      instagram: senData.ENLACES[0].INSTAGRAM,
      linkedin: senData.ENLACES[0].LINKEDIN,
      flickr: senData.ENLACES[0].FLICKR,
    }
  }
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
    await s3Client.send(new PutObjectCommand({
      Bucket: MainBucketKey.S3_BUCKET,
      Key: SenadoresBucketKey.img(senId, tipo),
      Body: response.data
    }));
  } catch (error) {
    throw error; // Puedes manejar el error aquí o dejar que se propague
  }
}

export const detectNewSlugs = async (legId: string) => {
  try {
    const [legislatura, senadores] = await Promise.all([
      legislaturaDtlRepo.getBy({legId}),
      senadorMapRawRepo.get()
    ]);

    if(legislatura) {
      const senadoresSet: SenadorMapRaw = {};
      for (const sesion of legislatura.sesiones) {
        if(sesion.votaciones) {
          for (const votacion of sesion.votaciones) {
            //for (const senador of votacion.)
          }
        }
      }
    }
  } catch (error) {
    return {} as LegislaturaMapDtl;
  }
}
