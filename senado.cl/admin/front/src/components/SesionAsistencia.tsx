import {AsistenciaRaw} from "@senado-cl/global/sesiones";
import SesionAsistenciaItem from "./SesionAsistenciaItem.tsx";
import {useEffect, useState} from "react";
import AsistenciaService from "../services/asistencia.service.ts";

interface Props {
  sesId: string
}

export default function SesionAsistencia({sesId}: Props) {
  const [asistencia, setAsistencia] = useState<AsistenciaRaw>();

  useEffect(() => {
    setAsistencia(undefined);
    AsistenciaService.getRaw(sesId)
      .then(data => setAsistencia(data));
  }, [sesId]);

  return asistencia ? (
    <ul role="list"
      className="divide-y divide-gray-100 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      {asistencia.detalle.map((d, idx) => (
        <SesionAsistenciaItem key={idx} detalle={d}/>
      ))}
    </ul>
  ) : <>Sin información</>;
}
