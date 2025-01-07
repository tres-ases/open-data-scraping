import {TipoLegislatura} from "./legislaturas.model";
import {LegislaturaSesionDtl} from "../Sesiones";

export interface LegislaturaDtl {
  id: number
  numero: number
  inicio: string
  termino: string
  tipo: TipoLegislatura
  sesiones: LegislaturaSesionDtl[]
}

export type LegislaturaMapDtl = {
  [key: number]: LegislaturaDtl
}
