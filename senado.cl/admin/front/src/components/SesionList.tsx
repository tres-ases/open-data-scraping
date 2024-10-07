import SesionItem from "./SesionItem.tsx";
import {LegislaturaSesionDtl} from "@senado-cl/global/model";

interface Props {
  sesiones: LegislaturaSesionDtl[]
}

export default function SesionList({sesiones}: Props) {
  return (
    <ul role="list" className="divide-y divide-gray-200">
      {sesiones.map(s => (
        <li key={s.id} className="flex items-center justify-between gap-x-6 px-4 py-5 group hover:bg-gray-50">
          <SesionItem sesion={s}/>
        </li>
      ))}
    </ul>
  );
}
