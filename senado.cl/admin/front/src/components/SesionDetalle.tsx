import {LegislaturaSesionDtl} from "@senado-cl/global/sesiones";
import SesionTipoTag from "./SesionTipoTag.tsx";
import {Link} from "react-router-dom";
import {ChevronRightIcon} from "@heroicons/react/24/outline";

interface Props {
  sesion: LegislaturaSesionDtl
}

export default function SesionDetalle({sesion}: Props) {
  const {numero, tipo, fecha, horaInicio, horaTermino, legId, legNumero, asistencia, votaciones} = sesion;
  const boletines = votaciones ? votaciones.reduce(
    (curr, acc) => {
      acc.boletin && curr.add(acc.boletin.indexOf('-') > 0 ? acc.boletin.split('-')[0] : acc.boletin);
      return curr;
    }, new Set()).size : 0;
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex mb-2">
          <ol role="list" className="flex items-center space-x-2">
            <li>
              <div className="flex items-center">
                <Link to="/legislaturas" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                  Legislaturas
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-gray-400"/>
                <Link to={`/legislatura/${legId}`}
                      className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Legislatura
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-gray-400"/>
                <p className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                  Sesión
                </p>
              </div>
            </li>
          </ol>
        </nav>
        <div className="flex flex-wrap">
          <h3 className="flex-auto text-base font-semibold leading-7 text-gray-900">Sesión N° {numero}</h3>
          <div className="flex-none">
            <SesionTipoTag tipo={tipo}/>
          </div>
        </div>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
          <time dateTime={fecha}>{fecha}</time>
          &nbsp;
          <time dateTime={horaInicio}>{horaInicio}</time>
          {' - '}
          <time dateTime={horaTermino}>{horaTermino}</time>
        </p>
      </div>
      <div className="border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Legislatura</dt>
            <dd className="mt-1 flex text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              <span className="flex-grow">
                <p>N° {legNumero}</p>
                <p className="text-xs text-gray-500">id: {legId}</p>
              </span>
              <span className="ml-4 flex-shrink-0">
                <Link to={`/legislatura/${legId}`}
                      className="rounded-md bg-white font-medium text-indigo-600 hover:text-indigo-500">
                  Ver
                </Link>
              </span>
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Asistencia</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {asistencia ? (
                <>
                  {asistencia.resumen.asistentes} asistentes<br/>
                  {asistencia.resumen.inasistentes.justificados} {asistencia.resumen.inasistentes.justificados === 1 ? 'inasistente justificado' : 'inasistentes justificados'}<br/>
                  {asistencia.resumen.inasistentes.injustificados} {asistencia.resumen.inasistentes.injustificados === 1 ? 'inasistente injustificado' : 'inasistentes injustificados'}
                </>
              ) : 'Sin información'}
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Votaciones</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {votaciones ? (
                <>
                  {votaciones.length} {votaciones.length === 1 ? 'votación' : 'votaciones'}<br/>
                  {boletines} {boletines === 1 ? 'boletín' : 'boletines'}
                </>
              ) : 'Sin información'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
