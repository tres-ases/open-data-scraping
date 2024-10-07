import {Link} from "react-router-dom";
import {LegislaturaSesionDtl} from "@senado-cl/global/model";
import SesionTipoTag from "./SesionTipoTag.tsx";

interface Props {
  sesion: LegislaturaSesionDtl
}

export default function SesionItem({sesion}: Props) {
  const {id, numero, tipo, fecha, horaInicio, horaTermino, asistencia, votaciones} = sesion;
  return (
    <>
      <div className="min-w-0">
        <div className="flex items-start gap-x-3">
          <Link to={`/sesion/${id}`} className="text-sm font-semibold leading-6 text-gray-900">
            Sesión N° {numero}
          </Link>
          <SesionTipoTag tipo={tipo}/>
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
          <p className="whitespace-nowrap">
            <time dateTime={fecha}>{fecha}</time>{' '}
            <time dateTime={horaInicio}>{horaInicio}</time>
            - <time dateTime={horaTermino}>{horaTermino}</time>
          </p>
          <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
            <circle r={1} cx={1} cy={1}/>
          </svg>
          <p className="truncate">(Id: {id})</p>
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-rose-500">
          {asistencia && asistencia.totalSenadores ? <p className="truncate">Asistencia: {asistencia.totalSenadores}</p> : <></>}
          {asistencia && asistencia.totalSenadores && votaciones ? (
            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
              <circle r={1} cx={1} cy={1}/>
            </svg>
          ) : (<></>)}
          {votaciones ? (
            <p className="truncate">Votaciones: {votaciones.length}</p>
          ) : <></>}
        </div>
      </div>
    </>
  );
}
