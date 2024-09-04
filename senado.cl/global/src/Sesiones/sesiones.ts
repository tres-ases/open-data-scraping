export const SesionesBucketKey = {
  rawJson: (legId: string | number) => `raw/sesiones/legId=${legId}/data.json`,
  rawAsistenciaJson: (sesId: string | number) => `raw/sesion/asistencia/sesId=${sesId}/data.json`,
  rawVotacionJson: (sesId: string | number) => `raw/sesion/votacion/sesId=${sesId}/data.json`,
}
