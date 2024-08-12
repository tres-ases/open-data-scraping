import {AnoMes} from "@senado-cl/global/dieta";

export interface Parlamentario {
  id: string
  nombre: string
}

export interface AnoMesParl extends AnoMes {
  parlId: number
}

export interface GastosOperacionales {
  concepto: string
  monto: number
}

export type ParlamentariosMap = { [id: string]: string };
