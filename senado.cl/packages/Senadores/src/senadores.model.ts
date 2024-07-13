export enum PeriodoTipo {
  S = 'S',
  D = 'D'
}

export interface Periodo {
  tipo: PeriodoTipo
  rango: {
    inicio: number
    fin: number
  }
}

export interface PeriodoSenador {
  id: number
  nombre: string
  periodos: Periodo[]
}
