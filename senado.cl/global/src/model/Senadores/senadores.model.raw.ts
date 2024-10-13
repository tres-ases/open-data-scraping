export interface SenadorMapDataRaw {
  uuid: string
  parlId: number
  parNombre: string
  parApellidoPaterno: string
  parApellidoMaterno: string
}

export interface SenadorMapRaw {
  [parSlug: string]: SenadorMapDataRaw
}
