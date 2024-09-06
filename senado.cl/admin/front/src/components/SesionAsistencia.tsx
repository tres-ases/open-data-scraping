import {Asistencia} from "@senado-cl/global/sesiones";
import SesionAsistenciaItem from "./SesionAsistenciaItem.tsx";

interface Props {
  asistencia?: Asistencia
}

export default function SesionAsistencia({asistencia}: Props) {
  return asistencia ? (
    <ul role="list"
      className="divide-y divide-gray-100 overflow-hidden bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      {asistencia.detalle.map(d => (
        <SesionAsistenciaItem detalle={d}/>
      ))}
    </ul>
  ) : <>Sin información</>;
}
