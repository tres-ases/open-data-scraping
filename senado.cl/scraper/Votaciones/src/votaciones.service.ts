import {CommonsData} from "@senado-cl/scraper-commons";
import axios from "axios";
import {VotacionesResponse} from "./votaciones.model";

const VOTACIONES_URL = `${CommonsData.SENADO_WEB_BACK_API}/votes`;

export const getVotaciones = async (legId: number) => {
  const votaciones = await axios.get<VotacionesResponse>(VOTACIONES_URL, {
    params: {
      id_legislatura: legId,
      limit: 1000
    }
  });
  return votaciones.data;
}
