import {VotacionRaw} from "../model";
import {VotacionDetalleTable, VotacionDetalleVotoTable, VotacionTable} from "../model/Votaciones";

export const VotacionesMapper = {
  votacionRaw2VotacionTable: ({
                                       id,
                                       sesId,
                                       sesNumero,
                                       fecha,
                                       hora,
                                       tema,
                                       quorum,
                                       boletin
                                     }: VotacionRaw): VotacionTable => ({
    votId: id,
    sesId, sesNumero, fecha, hora, tema, quorum, boletin,
  }),

  votacionRaw2VotacionDetalleTable: ({
                                              id,
                                              detalle
                                            }: VotacionRaw): VotacionDetalleTable[] => {
    return detalle.si.map(({parlId, parSlug}) => ({
      votId: id,
      parId: parlId,
      parSlug,
      voto: "si" as VotacionDetalleVotoTable
    })).concat(
      detalle.no.map(({parlId, parSlug}) => ({
        votId: id,
        parId: parlId,
        parSlug,
        voto: "no" as VotacionDetalleVotoTable
      }))
    ).concat(
      detalle.abstencion.map(({parlId, parSlug}) => ({
        votId: id,
        parId: parlId,
        parSlug,
        voto: "abstencion" as VotacionDetalleVotoTable
      }))
    ).concat(
      detalle.pareo.map(({parlId, parSlug}) => ({
        votId: id,
        parId: parlId,
        parSlug,
        voto: "pareo" as VotacionDetalleVotoTable
      }))
    );
  }
}
