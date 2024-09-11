import {TipoLegislatura} from "./legislaturas.model";

export interface LegislaturaSc {
  ID_LEGISLATURA: number
  NUMERO: number
  INICIO: string
  TERMINO: string
  TIPO: TipoLegislatura
}

export interface LegislaturaRaw {
  id: number
  numero: number
  inicio: string
  termino: string
  tipo: TipoLegislatura
}
