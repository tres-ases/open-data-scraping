import {ProyectosMapDataRaw} from "@senado-cl/global/model";
import {Link} from "react-router-dom";

interface Props {
  data: ProyectosMapDataRaw
}

export default function ProyectosListItem({data: {boletin, tema}}: Props) {
  const boletinLimpio = boletin.indexOf('-') > 0 ? boletin.split('-')[0] : boletin;

  return (
    <li className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
      <div className="flex min-w-0 gap-x-4">
        <div className="min-w-0 flex-auto">
          <p className="text-sm font-semibold leading-6 text-gray-900">
            <Link to={`/proyecto/${boletinLimpio}`}>
              <span className="absolute inset-x-0 -top-px bottom-0"/>
              {boletinLimpio}
            </Link>
          </p>
          <p className="text-xs font-normal leading-6 text-gray-700">
            {tema}
          </p>
          <p className="mt-1 flex text-xs leading-5 text-gray-400">
            <a target="_blank" className="relative truncate hover:underline"
               href={`GET https://tramitacion.senado.cl/wspublico/tramitacion.php?boletin=${boletinLimpio}`}>
              Ver XML en senado.cl
            </a>
          </p>
        </div>
      </div>
    </li>
  );
}
