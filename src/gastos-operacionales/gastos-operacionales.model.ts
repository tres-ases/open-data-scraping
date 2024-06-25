export interface Parlamentario {
  id: string
  nombre: string
}

export interface GastosOperacionales {
  concepto: string
  monto: number
}

export type ParlamentariosMap = { [id: string]: string };
