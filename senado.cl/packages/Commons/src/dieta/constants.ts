const DIETA_S3_BASE_BUCKET_KEY = 'Dieta';

export default {
  S3_BUCKET_KEY_ANO_MES_JSON_STRUCTURED: `${DIETA_S3_BASE_BUCKET_KEY}/AnoMes/JsonStructured/data.json`,
  S3_BUCKET_KEY_ANO_MES_JSON_LINES: `${DIETA_S3_BASE_BUCKET_KEY}/AnoMes/JsonLines/data.jsonl`,
  S3_BUCKET_KEY_DETALLE_JSON_STRUCTURED:
    (ano: string, mes: string) => `${DIETA_S3_BASE_BUCKET_KEY}/Detalle/JsonStructured/ano=${ano}/mes=${mes}/data.json`,
  S3_BUCKET_KEY_DETALLE_JSON_LINES:
    (ano: string, mes: string) => `${DIETA_S3_BASE_BUCKET_KEY}/Detalle/JsonLines/ano=${ano}/mes=${mes}/data.jsonl`,

  GET_ANO_URL: 'https://www.senado.cl/appsenado/index.php?mo=transparencia&ac=informeTransparencia&tipo=7',

  GET_ANO_MES_URL: (ano: string, mes: string = "0") => `https://tramitacion.senado.cl/appsenado/index.php?mo=transparencia&ac=informeTransparencia&tipo=7&anno=${ano}&mesid=${mes}`,
}
