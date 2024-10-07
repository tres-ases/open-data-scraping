export const LegislaturasBucketKey = {
  rawJson: `raw/legislaturas/data.json`,
  distilledJson: `distilled/legislaturas/data.json`,
  distilledDetailJson: (legId: string | number) => `distilled/legislatura/legId=${legId}/data.json`
}
