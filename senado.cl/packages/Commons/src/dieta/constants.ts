const DIETA_S3_BASE_BUCKET_KEY = '/Dieta';

export default {
  S3_BUCKET_KEY_ANO_MES: `${DIETA_S3_BASE_BUCKET_KEY}/AnoMes`,

  GET_ANO_URL: 'https://www.senado.cl/appsenado/index.php?mo=transparencia&ac=informeTransparencia&tipo=7',

  GET_ANO_MES_URL: (ano: string) => `https://tramitacion.senado.cl/appsenado/index.php?mo=transparencia&ac=informeTransparencia&tipo=7&anno=${ano}&mesid=0`,
}
