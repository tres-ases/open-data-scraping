import {VotacionRaw} from "@senado-cl/global/model";
import {useEffect, useState} from "react";
import VotacionesService from "../services/votaciones.service.ts";
import SesionVotacionItem from "./SesionVotacionItem.tsx";
import SesionVotacionItemLoading from "./SesionVotacionItemLoading.tsx";

interface Props {
  sesId: string
}

export default function SesionVotaciones({sesId}: Props) {
  const [votaciones, setVotaciones] = useState<VotacionRaw[]>();

  useEffect(() => {
    setVotaciones(undefined);
    VotacionesService.getRawList(sesId)
      .then(data => setVotaciones(data));
  }, [sesId]);

  return votaciones ? (
    <ul role="list"
        className="divide-y divide-gray-100 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      {votaciones.map((d, idx) => (
        <SesionVotacionItem key={idx} votacion={d}/>
      ))}
    </ul>
  ) : (
    <ul role="list"
        className="divide-y divide-gray-100 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      {[1, 2, 3].map((d) => (
        <SesionVotacionItemLoading key={d}/>
      ))}
    </ul>
  );
}
