import {Sesion} from "@senado-cl/global/sesiones";
import SesionTipoTag from "./SesionTipoTag.tsx";
import {Link} from "react-router-dom";

interface Props {
  sesion: Sesion
}

export default function SesionDetalle({sesion}: Props) {
  const {numero, tipo, fecha, horaInicio, horaTermino, legId, legNumero, asistencia, votaciones} = sesion;
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-6 sm:px-6">
        <div className="flex flex-wrap">
          <h3 className="flex-auto text-base font-semibold leading-7 text-gray-900">Sesión N° {numero}</h3>
          <div className="flex-none">
            <SesionTipoTag tipo={tipo}/>
          </div>
        </div>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
          <time dateTime={fecha}>{fecha}</time>&nbsp;
          <time dateTime={horaInicio}>{horaInicio}</time>
          {' - '}<time dateTime={horaTermino}>{horaTermino}</time>
        </p>
      </div>
      <div className="border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Legislatura</dt>
            <dd className="mt-1 flex text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              <span className="flex-grow">
                <p>N° {legNumero}</p>
                <p className="text-xs text-gray-500">id: {legId}</p>
              </span>
              <span className="ml-4 flex-shrink-0">
                <Link to={`/legislatura/${legId}`} className="rounded-md bg-white font-medium text-indigo-600 hover:text-indigo-500">
                  Ver
                </Link>
              </span>
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Asistencia</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {asistencia ? (
                <>
                  {asistencia.detalle.filter(a => a.asistencia === 'Asiste').length} asistentes<br/>
                  {asistencia.detalle.filter(a => a.asistencia === 'Ausente' && a.justificacion).length} inasistentes
                  justificados<br/>
                  {asistencia.detalle.filter(a => a.asistencia === 'Ausente' && !a.justificacion).length} inasistentes
                  injustificados
                </>
              ) : 'Sin información'}
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-900">Votaciones</dt>
            <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              {votaciones ? (
                <>
                  {votaciones.length} votaciones<br/>
                  {votaciones.reduce(
                    (curr, acc) => {
                      acc.boletin && curr.add(acc.boletin.indexOf('-') > 0 ? acc.boletin.split('-')[0] : acc.boletin);
                      return curr;
                    }, new Set()).size} boletines
                </>
              ) : 'Sin información'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
