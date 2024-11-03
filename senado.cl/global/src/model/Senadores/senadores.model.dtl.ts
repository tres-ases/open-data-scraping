export interface SenadoresMapDtl {
  [parSlug: string]: SenadorMapDataDtl
}

export interface SenadorMapDataDtl {
  id: number
  uuid: string
  slug: string
  nombreCompleto: string
  partido: {
    id: number
    nombre: string
  }
  region: {
    id: number
    nombre: string
  }
  sexo: {
    valor: 1 | 2
    etiqueta: string
    etiquetaAbreviatura: string
  }
}
