export interface PartidosMapDtl {
  [parSlug: string]: PartidoDtl
}

export interface PartidoDtl {
  id: number
  nombre: string
  senadores: PartidoSenadorDtl[]
}

export interface PartidoSenadorDtl {
  id: number
  uuid: string
  slug: string
  nombreCompleto: string
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
