import {LegislaturaRaw} from "./legislaturas.model.raw";
import {LegislaturaDtl} from "./legislaturas.model.dtl";
import {SesionesMapper, SesionRaw} from "../Sesiones";

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
