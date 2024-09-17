import {LegislaturaDtl} from "@senado-cl/global/legislaturas";
import LegislaturaDtlItem from "./LegislaturaDtlItem.tsx";
import LegislaturaDtlItemLoading from "./LegislaturaDtlItemLoading.tsx";

interface Props {
  data?: LegislaturaDtl[]
}

export default function LegislaturaDtlList({data}: Props) {
  return (
    <ul role="list" className="divide-y divide-gray-200">
      {data ? data.map(l => (
        <li key={l.id} className="flex items-center justify-between gap-x-6 px-6 py-5 group hover:bg-gray-50">
          <LegislaturaDtlItem data={l}/>
        </li>
      )) : [1, 2, 3].map(i => (
        <LegislaturaDtlItemLoading key={i}/>
      ))}
    </ul>
  );
}
