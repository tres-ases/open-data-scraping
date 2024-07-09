import {Ano, AnoMesFlatten} from "./model";

function flattenAno(ano: Ano) {
  return ano.meses
    .map(
      mes =>
        JSON.stringify({
          anoId: ano.id,
          anoDesc: ano.description,
          mesId: mes.id,
          mesDesc: mes.description
        } as AnoMesFlatten)
    )
    .join("\n");
}

export default {
  flattenAno
}
