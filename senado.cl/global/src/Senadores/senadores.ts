export const SenadoresBucketKey = {
  rawJson: (senId: number | string) => `raw/senador/senId=${senId}/data.json`,
  img: (senId: number | string, tipo: string = 'default') => `img/senador/${senId}/${tipo}.jpg`,
}
