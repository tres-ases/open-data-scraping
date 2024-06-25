import {Resultados} from "../commons/commons.model";
import {Votacion} from "./votaciones.model";

export interface ResultadosVotacionesDetalle extends Resultados {
  boletinesError: {
    legislatura: {
      id: string, descripcion: string
    }
    sesionSala: {
      id: string, descripcion: string
    }
    votacion: Votacion
  }[]
}
