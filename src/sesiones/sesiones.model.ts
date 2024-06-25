export interface SesionSala {
  id: string
  description: string
}

export interface Legislatura {
  id: string
  description: string
  sesionesSala?: SesionSala[]
}
