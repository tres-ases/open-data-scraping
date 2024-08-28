const parlIdPrefixJsonStructured = (parlId: number | string) => `GastosOperacionales/JsonStructured/parlId=${parlId}`;
const parlIdPrefixJsonLines = (parlId: number | string) => `GastosOperacionales/JsonLines/parlId=${parlId}`;

export const GastosOperacionalesBucketKey = {
  parlIdPrefixJsonStructured,
  parlIdPrefixJsonLines,
  parlIdAnoMesJsonStructured: (parlId: number, ano: number, mes: number) => `${parlIdPrefixJsonStructured(parlId)}/ano=${ano}/mes=${mes}/data.json`,
  parlIdAnoMesJsonLines: (parlId: number, ano: number, mes: number) => `${parlIdPrefixJsonLines(parlId)}/ano=${ano}/mes=${mes}/data.jsonl`,
}
