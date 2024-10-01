import {VotacionRaw} from "@senado-cl/global/sesiones";
import {useEffect, useState} from "react";
import VotacionesService from "../services/votaciones.service.ts";

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

  console.log(votaciones)
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-6 sm:px-6">
        <div className="flex flex-wrap">
          <h3 className="flex-auto text-base font-semibold leading-7 text-gray-900">Votaciones</h3>
        </div>
      </div>
    </div>
  );
}
