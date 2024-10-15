export interface ProyectosMapDataRaw {
  boletin: string
  fecha: string
  hora: string
  tema: string
  quorum: string
  resultado: {
    si: number
    no: number
    abs: number
    pareo: number
  }
}

export interface ProyectosMapRaw {
  [boletin: string]: ProyectosMapDataRaw
}

export interface ProyectoDescripcionRaw {
  boletin: string
  titulo: string
  fechaIngreso: string
  iniciativa: string
  camaraOrigen: string
  urgenciaActual: string
  etapa: string
  subEtapa: string
  leyNumero: string
  diarioOficial: string
  estado: string
  //refundidos
  linkMensajeMocion: string
}

export interface ProyectoAutorRaw {
  parlamentario: string
}

export interface ProyectoTramiteRaw {
  sesion: string
  fecha: string
  descripcionTramite: string
  etapaDescripcion: string
  camaraTramite: string
}

export interface ProyectoVotacionVoto {
  parlamentario: string
  seleccion: string
}

export interface ProyectoVotacionRaw {
  sesion: string
  fecha: string
  tema: string
  si: string
  no: string
  abstencion: string
  pareo: string
  quorum: string
  tipoVotacion: string
  etapa: string
  detalle: ProyectoVotacionVoto[]
}

export interface ProyectoUrgenciaRaw {
  tipo: string
  ingresoFecha: string
  ingresoMensaje: string
  ingresoCamara: string
  retiroFecha: string
  retiroMensaje: string
  retiroCamara: string
}

export interface ProyectoInformeRaw {
  fecha: string
  tramite: string
  etapa: string
  link: string
}

export interface ProyectoComparadoRaw {
  comparado: string
  link: string
}

export interface ProyectoOficioRaw {
  fecha: string
  tramite: string
  etapa: string
  tipo: string
  camara: string
  descripcion: string
  link: string
}

export interface ProyectoIndicacionRaw {
  fecha: string
  tramite: string
  etapa: string
  link: string
}

export interface ProyectoObservacionRaw {

}

export interface ProyectoRaw {
  descripcion: ProyectoDescripcionRaw
  autores: ProyectoAutorRaw[]
  tramitaciones: ProyectoTramiteRaw[]
  votaciones: ProyectoVotacionRaw[]
  urgencias: ProyectoUrgenciaRaw[]
  informes: ProyectoInformeRaw[]
  comparados: ProyectoComparadoRaw[]
  oficios: ProyectoOficioRaw[]
  indicaciones: ProyectoIndicacionRaw[]
  observaciones: ProyectoObservacionRaw[]
  materias: string[]
}
