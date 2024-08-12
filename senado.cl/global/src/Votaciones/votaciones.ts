
export const VotacionesBucketKey = {
  legislaturaListJsonStructured: 'Votaciones/Legislaturas/Lista/JsonStructured/data.json',
  legislaturaListJsonLines: 'Votaciones/Legislaturas/Lista/JsonLines/data.jsonl',

  legislaturaDetalleJsonStructured: (legisId: number) => `Votaciones/Legislaturas/Detalle/JsonStructured/legisId=${legisId}/data.json`,

  sesionListJsonStructured: (legisId: number) => `Votaciones/Legislaturas/Sesiones/JsonStructured/legisId=${legisId}/data.json`,
  sesionListJsonLines: (legisId: number) => `Votaciones/Legislaturas/Sesiones/JsonLines/legisId=${legisId}/data.jsonl`,

  votacionResumenListJsonStructured: (legisId: number, sesionId: number) => `Votaciones/Resumen/JsonStructured/legisId=${legisId}/sesionId=${sesionId}/data.json`,
  votacionResumenListJsonLines: (legisId: number, sesionId: number) => `Votaciones/Resumen/JsonLines/legisId=${legisId}/sesionId=${sesionId}/data.jsonl`,
}
