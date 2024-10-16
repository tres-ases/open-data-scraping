import {LegislaturaMapDtl, LegislaturaRaw} from "@senado-cl/global/model";
import LegislaturaListItem from "./LegislaturaListItem.tsx";
import LegislaturaListItemLoading from "./LegislaturaListItemLoading.tsx";

interface Props {
  rawList?: LegislaturaRaw[]
  dtlMap?: LegislaturaMapDtl
}

export default function LegislaturaList({rawList, dtlMap = {}}: Props) {
  return (
    <ul role="list" className="divide-y divide-gray-200">
      {rawList ? rawList
        .sort((a,b) => b.numero - a.numero)
        .map(l => (
        <li key={l.id} className="flex items-center justify-between gap-x-6 px-6 py-5 group hover:bg-gray-50">
          <LegislaturaListItem raw={l} dtl={dtlMap[l.id]}/>
        </li>
      )) : [1, 2, 3].map(i => (
        <LegislaturaListItemLoading key={i}/>
      ))}
    </ul>
  );
}
