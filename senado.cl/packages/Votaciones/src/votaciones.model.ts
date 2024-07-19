export const getLegislaturaListJsonStructuredBucketKey = () => `Votaciones/Legislaturas/Lista/JsonStructured/data.json`;
export const getLegislaturaListJsonListBucketKey = () => `Votaciones/Legislaturas/Lista/JsonLines/data.json`;
export const getLegislaturaDetalleJsonStructuredBucketKey = (legisId: number) => `Votaciones/Legislaturas/Detalle/JsonStructured/legisId=${legisId}/data.json`;
export const getLegislaturaSesionesJsonStructuredBucketKey = (legisId: number) => `Votaciones/Legislaturas/Sesiones/JsonStructured/legisId=${legisId}/data.json`;
export const getLegislaturaSesionesJsonLinesBucketKey = (legisId: number) => `Votaciones/Legislaturas/Sesiones/JsonLines/legisId=${legisId}/data.json`;

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
