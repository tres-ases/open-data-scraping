import {LegislaturaSc} from "@senado-cl/global/model";

export interface LegislaturasResponse {
  data: LegislaturaSc[]
  status: 'ok'
  results: number
}
