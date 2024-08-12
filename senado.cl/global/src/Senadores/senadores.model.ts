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

export enum SenadorFotoTipo {
  NORMAL = 1,
  MINI = 3
}

export interface ParlamentarioDetalle {
  nombre: string
  region: string
  partido?: string
  telefono?: string
  correo?: string
}
