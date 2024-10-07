import {SesionTipo} from "./sesiones.model";

export interface LegislaturaSesionDtl {
  id: number
  numero: string
  legNumero: number
  legId: number
  fecha: string
  horaInicio: string
  horaTermino: string
  tipo: SesionTipo
  cuenta: 1 | 0
  asistencia?: LegislaturaAsistenciaDtl
  votaciones?: LegislaturaVotacionDtl[]
}

export interface LegislaturaAsistenciaDtl {
  totalSenadores: number
  totalSesiones: number
  inicio: string
  termino: string
  resumen: {
    asistentes: number
    inasistentes: {
      justificados: number
      injustificados: number
    }
  }
}

export interface LegislaturaVotacionDtl {
  fecha: string
  hora: string
  tema: string
  quorum: string
  boletin: string
  resultado: {
    si: number
    no: number
    abs: number
    pareo: number
  }
}
