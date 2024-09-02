export type QuorumType = 'Q.C.' | 'Mayoría simple' | 'Cuatro séptimos Q.C.';

export interface VotacionDetalleSc {
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
  QUORUM: QuorumType
  BOLETIN: string
  SI: number
  NO: number
  ABS: number
  PAREO: number
  VOTACIONES: {
    SI: VotacionDetalleSc[] | 0
    NO: VotacionDetalleSc[] | 0
    ABSTENCION: VotacionDetalleSc[] | 0
    PAREO: VotacionDetalleSc[] | 0
  }
}

export interface VotacionesDataResponse {
  total: number
  data: VotacionSc[]
}

export interface VotacionesResponse {
  data: VotacionesDataResponse
  status: 'ok'
  results: number
}
