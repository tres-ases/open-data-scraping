export const VotacionesBucketKey = {
  table: (sesId: string | number) => `pre_table/sesion_votacion/sesId=${sesId}/data.json`,
  tableDetalle: (votId: string | number) => `pre_table/sesion_votacion_detalle/votId=${votId}/data.json`,
}
