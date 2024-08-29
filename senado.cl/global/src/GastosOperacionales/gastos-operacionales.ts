const parlIdPrefixJsonStructured = (parlId: number | string) => `GastosOperacionales/JsonStructured/parlId=${parlId}`;
const parlIdPrefixJsonLines = (parlId: number | string) => `GastosOperacionales/JsonLines/parlId=${parlId}`;

export const GastosOperacionalesBucketKey = {
  parlIdPrefixJsonStructured,
  parlIdPrefixJsonLines,
  parlIdAnoMesJsonStructured: (parlId: number | string, ano: number | string, mes: number | string) => `${parlIdPrefixJsonStructured(parlId)}/ano=${ano}/mes=${mes}/data.json`,
  parlIdAnoMesJsonLines: (parlId: number | string, ano: number | string, mes: number | string) => `${parlIdPrefixJsonLines(parlId)}/ano=${ano}/mes=${mes}/data.jsonl`,
}
