import {Link} from "react-router-dom";
import {Sesion, SesionTipo} from "@senado-cl/global/sesiones";

const sesionTipoColor: { [key in SesionTipo]: string } = {
  'Ordinaria': 'yellow',
  'Extraordinaria': 'green',
  'Especial': 'cyan',
  'Congreso pleno': 'red',
}

const SesionTipoTag = (tipo: SesionTipo) => {
  const color = sesionTipoColor[tipo] ? sesionTipoColor[tipo] : 'gray';
  return <p
    className={`text-${color}-700 bg-${color}-50 ring-${color}-600/20 mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset`}>
    {tipo}
  </p>
}

interface Props {
  sesion: Sesion
}

export default function SesionItem({sesion}: Props) {
  const {id, numero, tipo, fecha, horaInicio, horaTermino, asistencia, votaciones} = sesion;
  return (
    <>
      <div className="min-w-0">
        <div className="flex items-start gap-x-3">
          <p className="text-sm font-semibold leading-6 text-gray-900">N° {numero}</p>
          {SesionTipoTag(tipo)}
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
          <p className="whitespace-nowrap">
            <time dateTime={fecha}>{fecha}</time>
            <time dateTime={horaInicio}>{horaInicio}</time>
            - <time dateTime={horaTermino}>{horaTermino}</time>
          </p>
          <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
            <circle r={1} cx={1} cy={1}/>
          </svg>
          <p className="truncate">(Id: {id})</p>
          {asistencia ? <p className="truncate">(Senadores: {asistencia.totalSenadores})</p> : <></>}
          {votaciones ? <p className="truncate">(Votaciones: {votaciones.length})</p> : <></>}
        </div>
      </div>
      <div className="flex flex-none items-center gap-x-4">
        <Link
          to={`/sesion/${id}`}
          className="transition ease-in-out duration-300 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-50 hover:bg-gray-50 text-gray-200 group-hover:text-gray-900 group-hover:ring-gray-300"
        >
          Detalles
        </Link>
      </div>
    </>
  );
}