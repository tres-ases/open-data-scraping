export const SesionesBucketKey = {
  rawListJson: (legId: string | number) => `raw/sesiones/legId=${legId}/data.json`,
  rawDetalleJson: (sesId: string | number) => `raw/sesion/detalle/sesId=${sesId}/data.json`,
  rawAsistenciaJson: (sesId: string | number) => `raw/sesion/asistencia/sesId=${sesId}/data.json`,
  rawVotacionJson: (sesId: string | number) => `raw/sesion/votacion/sesId=${sesId}/data.json`,
  dtlJson: (sesId: string | number) => `distilled/sesion/sesId=${sesId}/data.json`
}
