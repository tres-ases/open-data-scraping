import {getLegislaturasSesionesIdSinVotacionSimple} from "./votaciones.service";

export const getLegislaturaListJsonStructuredBucketKey = () => `Votaciones/Legislaturas/Lista/JsonStructured/data.json`;
export const getLegislaturaListJsonLinesBucketKey = () => `Votaciones/Legislaturas/Lista/JsonLines/data.jsonl`;

export const getLegislaturaDetalleJsonStructuredBucketKey = (legisId: number) => `Votaciones/Legislaturas/Detalle/JsonStructured/legisId=${legisId}/data.json`;

export const getLegislaturaSesionesJsonStructuredBucketKey = (legisId: number) => `Votaciones/Legislaturas/Sesiones/JsonStructured/legisId=${legisId}/data.json`;
export const getLegislaturaSesionesJsonLinesBucketKey = (legisId: number) => `Votaciones/Legislaturas/Sesiones/JsonLines/legisId=${legisId}/data.jsonl`;

export const getLegislaturaSesionVotacionesResumenJsonStructuredBucketKey = (legisId: number, sesionId: number) => `Votaciones/Resumen/JsonStructured/legisId=${legisId}/sesionId=${sesionId}/data.json`;
export const getLegislaturaSesionVotacionesResumenJsonLinesBucketKey = (legisId: number, sesionId: number) => `Votaciones/Resumen/JsonLines/legisId=${legisId}/sesionId=${sesionId}/data.jsonl`;

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
