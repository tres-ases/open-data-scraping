export type SesionTipo = 'Especial' | 'Ordinaria' | 'Extraordinaria' | 'Congreso pleno'

export interface Sesion {
  id: number
  numero: string
  legNumero: number
  legId: number
  fecha: string
  horaInicio: string
  horaTermino: string
  tipo: SesionTipo
  cuenta: 1 | 0
  asistencia?: Asistencia
  votaciones?: Votacion[]
}

export type AsistenciaTipo = 'Asiste' | 'Ausente';

export interface AsistenciaDetalle {
  sesId: number
  sesNumero: number
  parId: number
  parNombre: string
  parApellidoPaterno: string
  parApellidoMaterno: string
  slug: string
  asistencia: AsistenciaTipo
  justificacion: null | string
}

export interface Asistencia {
  sesId: string
  sesNumero: number
  totalSenadores: number
  totalSesiones: number
  inicio: string
  termino: string
  detalle: AsistenciaDetalle[]
}

export interface VotacionDetalle {
  uuid: string
  parlId: number
  parSlug: string
  parNombre: string
  parApellidoPaterno: string
  parApellidoMaterno: string
}

export interface Votacion {
  id: number
  sesId: number
  sesNumero: number
  fecha: string
  hora: string
  tema: string
  quorum: string
  boletin: string
  resultado: {
    si: number
    no: number
    abs: number
    pareo: number
  }
  detalle: {
    si: VotacionDetalle[] | 0
    no: VotacionDetalle[] | 0
    abstencion: VotacionDetalle[] | 0
    pareo: VotacionDetalle[] | 0
  }
}
