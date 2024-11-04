export const LegislaturasBucketKey = {
  rawJson: `raw/legislaturas/data.json`,
  dtlJson: `dtl/legislaturas/data.json`,
  dtlDetailJson: (legId: string | number) => `dtl/legislatura/legId=${legId}/data.json`
}
