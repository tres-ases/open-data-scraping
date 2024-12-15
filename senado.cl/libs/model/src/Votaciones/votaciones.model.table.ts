export interface VotacionTable {
  votId: number
  sesId: number
  sesNumero: number
  fecha: string
  hora: string
  tema: string
  quorum: string
  boletin: string
}

export type VotacionDetalleVotoTable = 'si' | 'no' | 'abstencion' | 'pareo';

export interface VotacionDetalleTable {
  votId: number
  parId: number
  parSlug: string
  voto: VotacionDetalleVotoTable
}
