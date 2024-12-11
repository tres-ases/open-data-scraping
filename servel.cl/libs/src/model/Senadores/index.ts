export interface Votacion {
  [circunscripcion: string]: VotacionCircunscripcion
}

export interface VotacionCircunscripcion {
  region: {
    numero: number
    nombre: string
  }
  candidatos: CandidatosMap
  comunas: VotacionCircunscripcionComuna
  totales: {
    inscritos: number
    votos: Votos
  }
}

export interface VotacionCircunscripcionComuna {
  [comuna: string]: {
    inscritos: number
    votos: Votos
  }
}

export interface CandidatosMap {
  [id: string]: {
    nombre: string
    apellidoPaterno: string
    apellidoMaterno: string
    lista: string
    pacto: string
    partido: string
  }
}

export interface Votos {
  [id: string]: number,
  blancos: number,
  nulos: number
  total: number
}
