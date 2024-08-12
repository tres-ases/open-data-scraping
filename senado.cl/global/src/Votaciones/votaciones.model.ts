export interface LegislaturasSesionesId {
  legisId: number
  sesionId: number
}

export interface LegislaturaSimple {
  id: number
  numero: number
  desde: string
  hasta: string
}

export interface Legislatura extends LegislaturaSimple {
  sesiones: Sesion[]
}

export interface Sesion {
  id: number
  nombre: string
  numero?: number
  tipo?: string
  fecha?: string
}

export interface VotacionSimple {
  id: number
  tema: string
  quorum: string
  fecha: string
  boletin?: string
  resultados: {
    si: number
    no: number
    abstencion: number
    pareo: number
  }
}
