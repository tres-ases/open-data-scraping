export interface ProyectoDescripcion {
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

export interface ProyectoAutor {
  parlamentario: string
}

export interface ProyectoTramite {
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

export interface ProyectoVotacion {
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

export interface ProyectoUrgencia {
  tipo: string
  ingresoFecha: string
  ingresoMensaje: string
  ingresoCamara: string
  retiroFecha: string
  retiroMensaje: string
  retiroCamara: string
}

export interface ProyectoInforme {
  fecha: string
  tramite: string
  etapa: string
  link: string
}

export interface ProyectoComparado {
  comparado: string
  link: string
}

export interface ProyectoOficio {
  fecha: string
  tramite: string
  etapa: string
  tipo: string
  camara: string
  descripcion: string
  link: string
}

export interface ProyectoIndicacion {
  fecha: string
  tramite: string
  etapa: string
  link: string
}

export interface ProyectoObservacion {

}

export interface Proyecto {
  descripcion: ProyectoDescripcion
  autores: ProyectoAutor[]
  tramitaciones: ProyectoTramite[]
  votaciones: ProyectoVotacion[]
  urgencias: ProyectoUrgencia[]
  informes: ProyectoInforme[]
  comparados: ProyectoComparado[]
  oficios: ProyectoOficio[]
  indicaciones: ProyectoIndicacion[]
  observaciones: ProyectoObservacion[]
  materias: string[]
}
