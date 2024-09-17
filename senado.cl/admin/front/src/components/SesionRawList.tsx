import SesionRawItem from "./SesionRawItem.tsx";
import {SesionRaw} from "@senado-cl/global/sesiones";

interface Props {
  sesiones: SesionRaw[]
}

export default function SesionRawList({sesiones}: Props) {
  return (
    <ul role="list" className="divide-y divide-gray-200">
      {sesiones.map(s => (
        <li key={s.id} className="flex items-center justify-between gap-x-6 px-6 py-5 group hover:bg-gray-50">
          <SesionRawItem sesion={s}/>
        </li>
      ))}
    </ul>
  );
}
