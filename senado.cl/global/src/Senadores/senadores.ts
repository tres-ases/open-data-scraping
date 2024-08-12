import {SenadorFotoTipo} from "./senadores.model";

export const SenadoresBucketKey = {
  image: (parlId: number, tipo: SenadorFotoTipo) => `Senadores/Detalle/Foto/parlId=${parlId}/${tipo}.jpeg`,
  json: (parlId: number) => `Senadores/Detalle/JsonStructured/parlId=${parlId}/data.json`,
  periodoJsonStructured: 'Senadores/Periodos/JsonStructured/data.json',
  periodoJsonLines: 'Senadores/Periodos/JsonLines/data.jsonl'
}
