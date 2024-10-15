export interface SenadoresMapDataRaw {
  uuid: string
  parlId: number
  parNombre: string
  parApellidoPaterno: string
  parApellidoMaterno: string
}

export interface SenadoresMapRaw {
  [parSlug: string]: SenadoresMapDataRaw
}
