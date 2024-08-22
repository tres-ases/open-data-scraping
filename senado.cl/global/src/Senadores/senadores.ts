import {SenadorFotoTipo} from "./senadores.model";

const imgPrefix = 'Senadores/Detalle/Foto';

export const SenadoresBucketKey = {
  imgPrefix,
  image: (parlId: number | string, tipo: SenadorFotoTipo | string) => `${imgPrefix}/parlId=${parlId}/${tipo}.jpeg`,
  json: (parlId: number | string) => `Senadores/Detalle/JsonStructured/parlId=${parlId}/data.json`,
  periodoJsonStructured: 'Senadores/Periodos/JsonStructured/data.json',
  periodoJsonLines: 'Senadores/Periodos/JsonLines/data.jsonl'
}
