import {LegislaturaMapDtl, LegislaturaRaw} from "@odata-senado.cl/model";
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
        .sort((a, b) => b.numero - a.numero)
        .map(l => (
          <LegislaturaListItem key={l.id} raw={l} dtl={dtlMap[l.id]}/>
        )) : [1, 2, 3].map(i => (
        <LegislaturaListItemLoading key={i}/>
      ))}
    </ul>
  );
}
