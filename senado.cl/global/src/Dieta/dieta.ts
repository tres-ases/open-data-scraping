export const DietaBucketKey = {
  anoMesJsonStructured: 'Dieta/AnoMes/JsonStructured/data.json',
  anoMesJsonLines: 'Dieta/AnoMes/JsonLines/data.jsonl',
  detalleJsonStructured: (ano: string, mes: string) => `Dieta/Detalle/JsonStructured/ano=${ano}/mes=${mes}/data.json`,
  detalleJsonLines: (ano: string, mes: string) => `Dieta/Detalle/JsonLines/ano=${ano}/mes=${mes}/data.jsonl`,
}
