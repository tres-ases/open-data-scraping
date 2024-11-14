export const VotacionesBucketKey = {
  table: (sesId: string | number) => `table/sesion_votacion/sesId=${sesId}/data.json`,
  tableDetalle: (votId: string | number) => `raw/sesion_votacion_detalle/votId=${votId}/data.json`,
}
