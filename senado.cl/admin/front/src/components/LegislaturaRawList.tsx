import {LegislaturaRaw} from "@senado-cl/global/legislaturas";
import LegislaturaRawItem from "./LegislaturaRawItem.tsx";
import LegislaturaRawItemLoading from "./LegislaturaRawItemLoading.tsx";

interface Props {
  data?: LegislaturaRaw[]
  distillationEnd: (legId: number) => void
}

export default function LegislaturaRawList({data, distillationEnd}: Props) {
  return (
    <ul role="list" className="divide-y divide-gray-200">
      {data ? data.map(l => (
        <li key={l.id} className="flex items-center justify-between gap-x-6 px-6 py-5 group hover:bg-gray-50">
          <LegislaturaRawItem legislatura={l} distillationEnd={distillationEnd}/>
        </li>
      )) : [1, 2, 3].map(i => (
        <LegislaturaRawItemLoading key={i}/>
      ))}
    </ul>
  );
}
