import {AsistenciaRaw} from "@odata-senado.cl/model";
import SesionAsistenciaItem from "./SesionAsistenciaItem.tsx";
import {useEffect, useState} from "react";
import AsistenciaService from "../services/asistencia.service.ts";
import SesionAsistenciaItemLoading from "./SesionAsistenciaItemLoading.tsx";

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
  ) : (
    <ul role="list"
        className="divide-y divide-gray-100 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <SesionAsistenciaItemLoading/>
      {[1, 2, 3, 4, 5].map((d) => (
        <SesionAsistenciaItemLoading key={d}/>
      ))}
    </ul>
  );
}
