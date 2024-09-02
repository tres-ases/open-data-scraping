export type TipoLegislatura = null | 'Ordinaria' | 'Extraordinaria'

export interface LegislaturaSc {
  ID_LEGISLATURA: number
  NUMERO: number
  INICIO: string
  TERMINO: string
  TIPO: TipoLegislatura
}

export interface Legislatura {
  id: number
  numero: number
  inicio: string
  termino: string
  tipo: TipoLegislatura
}
