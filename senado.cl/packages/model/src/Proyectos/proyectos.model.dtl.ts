export interface ProyectosMapDtl {
  [boletin: string]: ProyectoDtl
}

export interface ProyectoDtl {
  boletin: string
  titulo: string
  fechaIngreso: string
  iniciativa: string
  camaraOrigen: string
  urgenciaActual: string
  etapa: string
  subEtapa: string
  leyNumero: string
  diarioOficial: string
  estado: string
  resumen: ProyectoResumenDtl
  materias: string[]
}

export interface ProyectoResumenDtl {
  autores: number
  tramitaciones: number
  votaciones: number
  urgencias: number
  informes: number
  comparados: number
  oficios: number
  indicaciones: number
  observaciones: number
}
