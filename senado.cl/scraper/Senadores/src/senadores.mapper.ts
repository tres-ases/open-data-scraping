import {SenadorRaw} from "@senado-cl/global/model";
import {ParliamentarianSenadoData} from "./senadores.model";

export const parliamentarianSenadoData2SenadorRaw = (senData: ParliamentarianSenadoData): SenadorRaw => {
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
    comite: senData.data[0].COMITE ? {
      id: senData.data[0].COMITE.ID,
      uuid: senData.data[0].COMITE.UUID,
      nombre: senData.data[0].COMITE.NOMBRE,
      abreviatura: senData.data[0].COMITE.ABREVIATURA,
    } : undefined,
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
}
