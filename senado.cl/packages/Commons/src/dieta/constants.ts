export default {
  GET_ANO_URL: 'https://www.senado.cl/appsenado/index.php?mo=transparencia&ac=informeTransparencia&tipo=7',

  GET_ANO_MES_URL: (ano: string, mes: string = "0") => `https://tramitacion.senado.cl/appsenado/index.php?mo=transparencia&ac=informeTransparencia&tipo=7&anno=${ano}&mesid=${mes}`,
}
