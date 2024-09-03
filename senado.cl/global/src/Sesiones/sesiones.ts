export const SesionesBucketKey = {
  json: (legId: string | number) => `raw/sesiones/legId=${legId}/data.json`,
  asistenciaJson: (sesId: string | number) => `raw/sesion/asistencia/sesId=${sesId}/data.json`,
  votacionJson: (sesId: string | number) => `raw/sesion/votacion/sesId=${sesId}/data.json`,
}
