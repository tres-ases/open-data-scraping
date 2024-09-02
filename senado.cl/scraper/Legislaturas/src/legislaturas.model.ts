import {LegislaturaSc} from "@senado-cl/global/legislaturas";

export interface LegislaturasResponse {
  data: LegislaturaSc[]
  status: 'ok'
  results: number
}
