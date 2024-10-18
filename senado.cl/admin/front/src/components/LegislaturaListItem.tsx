import {LegislaturaDtl, LegislaturaRaw, TipoLegislatura} from "@senado-cl/global/model";
import {Link} from "react-router-dom";
import {Button} from "@headlessui/react";
import Spinner from "./Spinner.tsx";
import SesionesService from "../services/sesiones.service.ts";
import clsx from "clsx";
import {useContext} from "react";
import {LegislaturasViewContext} from "../context/LegislaturasViewContext.tsx";

const tipoLegislatura = (tipo: TipoLegislatura) => {
  switch (tipo) {
    case 'Ordinaria':
      return <p
        className="text-yellow-800 bg-yellow-50 ring-yellow-600/20 mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset">
        {tipo}
      </p>
    case 'Extraordinaria':
      return <p
        className="text-green-700 bg-green-50 ring-green-600/20 mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset">
        {tipo}
      </p>
    default:
      return <></>
  }
}

interface Props {
  raw: LegislaturaRaw
  dtl?: LegislaturaDtl
}

export default function LegislaturaListItem({raw, dtl}: Props) {
  const {id, numero, tipo, inicio, termino} = raw;

  const {ids, add, remove} = useContext(LegislaturasViewContext);

  const process = () => {
    add(id);
    SesionesService.extract(id)
      .finally(() => remove(id));
  }

  const isProcessing = ids.has(id);

  return (
    <>
      <div className="min-w-0">
        <div className="flex items-start gap-x-3">
          {dtl ? (
            <Link to={`/legislatura/${id}`} className="text-sm font-semibold leading-6 text-gray-900">
              N° {numero}
            </Link>
          ) : (
            <div className="text-sm font-semibold leading-6 text-gray-900">
              N° {numero}
            </div>
          )}

          {tipoLegislatura(tipo)}
          {dtl && (
            <p
              className="text-blue-800 bg-blue-50 ring-blue-600/20 mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset">
              Destilado
            </p>
          )}
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
          <p className="truncate">Id: {id}</p>
          <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
            <circle r={1} cx={1} cy={1}/>
          </svg>
          <p className="whitespace-nowrap">
            <time dateTime={inicio}>{inicio}</time>
            {' - '}
            <time dateTime={termino}>{termino}</time>
          </p>
        </div>
        {dtl && (
          <div className="flex items-center gap-x-2 text-xs leading-5 text-rose-800">
            <p className="whitespace-nowrap">
              {dtl.sesiones.length} sesiones
            </p>
            <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
              <circle r={1} cx={1} cy={1}/>
            </svg>
            <p className="whitespace-nowrap">
              {dtl.sesiones.reduce(
                (acc, ses) => {
                  return acc + (ses.votaciones ? ses.votaciones.length : 0)
                }, 0
              )} votaciones
            </p>
          </div>
        )}
      </div>
      <span className="isolate inline-flex shadow-sm">
        <Button type="button" disabled={isProcessing} onClick={process}
                className={clsx(
                  'transition ease-in-out duration-300 ring-1 ring-inset ring-gray-50 hover:bg-gray-50 text-gray-200 hover:text-gray-900 hover:ring-gray-300',
                  'relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50 focus:z-10'
                )}>
          {isProcessing ? <Spinner/> : 'Procesar'}
        </Button>
      </span>
    </>
  );
}
