export interface Ano {
  id: string
  description: string
  meses: Mes[]
}

export interface Mes {
  id: string
  description: string
}

export interface AnoMesFlatten {
  anoId: string
  anoDesc: string
  mesId: string
  mesDesc: string
}

export interface Dieta {
  nombre: string
  monto: number
  descuentos: number
  saldo: number
}

export interface AnoMes {
  ano: number
  mes: number
}
