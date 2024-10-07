import {LegislaturaRaw, LegislaturaDtl, SesionRaw} from "../model";
import {SesionesMapper} from "../mapper";

export const LegislaturasMapper = {
  legislaturaRaw2LegislaturaDtl: (raw: LegislaturaRaw, rawSesList: SesionRaw[]): LegislaturaDtl => ({
    id: raw.id,
    numero: raw.numero,
    inicio: raw.inicio,
    termino: raw.termino,
    tipo: raw.tipo,
    sesiones: rawSesList.map(rawSes => SesionesMapper.sesionRaw2LegislaturaSesionDtl(rawSes))
  })
}
