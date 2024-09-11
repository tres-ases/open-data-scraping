import {AsistenciaTipo, SesionTipo} from "./sesiones.model";

export interface SesionRaw {
  id: number
  numero: string
  legNumero: number
  legId: number
  fecha: string
  horaInicio: string
  horaTermino: string
  tipo: SesionTipo
  cuenta: 1 | 0
  asistencia?: AsistenciaRaw
  votaciones?: VotacionRaw[]
}

export interface AsistenciaDetalleRaw {
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

export interface AsistenciaRaw {
  sesId: string
  sesNumero: number
  totalSenadores: number
  totalSesiones: number
  inicio: string
  termino: string
  detalle: AsistenciaDetalleRaw[]
}

export interface VotacionDetalleRaw {
  uuid: string
  parlId: number
  parSlug: string
  parNombre: string
  parApellidoPaterno: string
  parApellidoMaterno: string
}

export interface VotacionRaw {
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
    si: VotacionDetalleRaw[] | 0
    no: VotacionDetalleRaw[] | 0
    abstencion: VotacionDetalleRaw[] | 0
    pareo: VotacionDetalleRaw[] | 0
  }
}
