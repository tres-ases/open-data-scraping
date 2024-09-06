import {AsistenciaDetalle} from "@senado-cl/global/sesiones";
import {ChevronRightIcon} from "@heroicons/react/24/outline";
import {Link} from "react-router-dom";
import AsistenciaTipoTag from "./AsistenciaTipoTag.tsx";

interface Props {
  detalle: AsistenciaDetalle
}

export default function SesionAsistenciaItem({detalle}: Props) {
  const {parId, slug, parNombre, parApellidoPaterno, parApellidoMaterno, asistencia, justificacion} = detalle;
  const nombreCompleto = `${parNombre} ${parApellidoPaterno} ${parApellidoMaterno}`;

  return (
    <li className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
      <div className="flex min-w-0 gap-x-4">
        <img alt={nombreCompleto}
             src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
             className="h-12 w-12 flex-none rounded-full bg-gray-50"/>
        <div className="min-w-0 flex-auto">
          <p className="text-sm font-semibold leading-6 text-gray-900">
            <Link to={`/senador/${parId}`}>
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
      <div className="flex shrink-0 items-center gap-x-4">
        <div className="hidden sm:flex sm:flex-col sm:items-end">
          <p className="text-sm leading-6 text-gray-900">
            <AsistenciaTipoTag tipo={asistencia} justificacion={justificacion}/>
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {justificacion}
          </p>
        </div>
        <ChevronRightIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400"/>
      </div>
    </li>
  );
}
