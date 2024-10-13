export interface SenadorPeriodoRaw {
  id: number
  uuid: number
  camara: 'S' | 'D'
  desde: string
  hasta: string
  vigente: 1 | 0
}

export interface SenadorRaw {
  id: number
  uuid: string
  slug: string
  nombreCompleto: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  camara: 'S'
  partido: {
    id: number
    nombre: string
  }
  circunscripcionId: number
  region: {
    id: number
    nombre: string
  }
  comite?: {
    id: string
    uuid: string
    nombre: string
    abreviatura: string
  },
  fono: string
  email: string
  sexo: {
    valor: 1 | 2
    etiqueta: string
    etiquetaAbreviatura: string
  }
  periodos: SenadorPeriodoRaw[]
  cargos: string
  enlaces: {
    facebookPagina: string | null
    facebookCuenta: string | null
    twitter: string | null
    webPersonal: string | null
    instagram: string | null
    linkedin: string | null
    flickr: string | null
  }
}
