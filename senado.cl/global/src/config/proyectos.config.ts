export const ProyectosBucketKey = {
  rawMap: 'raw/boletines/data.json',
  rawJson: (bolId: number | string) => `raw/proyecto/bolId=${bolId}/data.json`,
}
