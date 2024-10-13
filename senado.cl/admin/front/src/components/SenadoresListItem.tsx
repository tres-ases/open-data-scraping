import {SenadorMapDataRaw} from "@senado-cl/global/model";
import {Link} from "react-router-dom";

interface Props {
  slug: string
  data: SenadorMapDataRaw
}

export default function SenadoresListItem({slug, data: {parlId, parNombre, parApellidoPaterno, parApellidoMaterno}}: Props) {
  const nombreCompleto = `${parNombre} ${parApellidoPaterno} ${parApellidoMaterno}`;

  return (
    <li className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
      <div className="flex min-w-0 gap-x-4">
        <img alt={nombreCompleto}
             src={`/img/senador/${parlId}/default.jpg`}
             className="h-12 w-12 flex-none rounded-full bg-gray-50"/>
        <div className="min-w-0 flex-auto">
          <p className="text-sm font-semibold leading-6 text-gray-900">
            <Link to={`/senador/${parlId}`}>
              <span className="absolute inset-x-0 -top-px bottom-0"/>
              {nombreCompleto}
            </Link>
          </p>
          <p className="mt-1 flex text-xs leading-5 text-gray-400">
            <a target="_blank" className="relative truncate hover:underline"
               href={`https://www.senado.cl/senadoras-y-senadores/listado-de-senadoras-y-senadores/${slug}`}>
              Ver perfil en senado.cl
            </a>
          </p>
        </div>
      </div>
    </li>
  );
}
