import {LegislaturaSc} from "@senado-cl/global/legislaturas";

export type SesionTipoSc = 'Especial' | 'Ordinaria' | 'Extraordinaria'

export interface SesionSc {
  ID_SESION: number
  NRO_SESION: string
  NRO_LEGISLATURA: number
  ID_LEGISLATURA: number
  FECHA: string
  HORA_INICIO: string
  HORA_TERMINO: string
  TIPO_SESION: SesionTipoSc
  CUENTA: 1 | 0
}

export interface SesionesResponse {
  data: {
    total: number
    data: SesionSc[] }
  status: 'ok'
  results: number
}

export interface AsistenciaDetalleSc {
  ASISTENCIA: 'Asiste' | 'Ausente'
  ID_PARLAMENTARIO: number
  NOMBRE: string
  APELLIDO_PATERNO: string
  APELLIDO_MATERNO: string
  SLUG: string
  ID_SESION: number
  NUMERO_SESION: number
  JUSTIFICACION: null | string
}

export interface AsistenciaSc {
  TOTAL_SENADORES: number
  TOTAL_SESIONES: number
  ID_SESION: string
  NUMERO_SESION: number
  FECHA_HORA_INICIO: string
  FECHA_HORA_TERMINO: string
  DATA: AsistenciaDetalleSc[]
}

export interface AsistenciaResponse {
  data: AsistenciaSc
  status: 'ok'
  results: number
}

export interface VotoDetalleSc {
  UUID: string
  PARLID: number
  APELLIDO_PATERNO: string
  APELLIDO_MATERNO: string
  NOMBRE: string
  SLUG: string
}

export interface VotacionSc {
  ID_VOTACION: number
  ID_SESION: number
  NUMERO_SESION: number
  FECHA_VOTACION: string
  HORA: string
  TEMA: string
  QUORUM: string
  BOLETIN: string
  SI: number
  NO: number
  ABS: number
  PAREO: number
  VOTACIONES: {
    SI: VotoDetalleSc[] | 0
    NO: VotoDetalleSc[] | 0
    ABSTENCION: VotoDetalleSc[] | 0
    PAREO: VotoDetalleSc[] | 0
  }
}

export interface VotacionesResponse {
  data: {
    total: number
    data: VotacionSc[]
  }
  status: 'ok'
  results: number
}
