import {LegislaturaRaw, TipoLegislatura} from "@senado-cl/global/legislaturas";
import {Link} from "react-router-dom";
import {Button} from "@headlessui/react";
import Spinner from "./Spinner.tsx";
import {useToggle} from "react-use";
import LegislaturaService from "../services/legislaturas.service.ts";
import SesionesService from "../services/sesiones.service.ts";
import clsx from "clsx";

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
  legislatura: LegislaturaRaw
  distillationEnd: (legId: number) => void
}

export default function LegislaturaRawItem({legislatura}: Props) {
  const {id, numero, tipo, inicio, termino} = legislatura;

  const [extracting, setExtracting] = useToggle(false);
  const [distilling, setDistilling] = useToggle(false);

  const extract = () => {
    setExtracting(true);
    SesionesService.extract(id)
      .then(result => console.log(result))
      .finally(() => setExtracting(false));
  }

  const distill = () => {
    setDistilling(true);
    LegislaturaService.distill(id)
      .then(result => console.log(result))
      .finally(() => setDistilling(false));
  }

  return (
    <>
      <div className="min-w-0">
        <div className="flex items-start gap-x-3">
          <Link to={`/legislatura/${id}`} className="text-sm font-semibold leading-6 text-gray-900">
            N° {numero}
          </Link>
          {tipoLegislatura(tipo)}
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
          <p className="whitespace-nowrap">
            <time dateTime={inicio}>{inicio}</time>
            - <time dateTime={termino}>{termino}</time>
          </p>
          <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
            <circle r={1} cx={1} cy={1}/>
          </svg>
          <p className="truncate">(Id: {id})</p>
        </div>
      </div>
      <div className="flex flex-none items-center gap-x-4">
        <span className="isolate inline-flex rounded-md shadow-sm">
          <Button type="button" disabled={extracting} onClick={extract}
                  className={clsx(
                    'transition ease-in-out duration-300',
                    'relative inline-flex items-center rounded-l-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10'
                  )}>
            {extracting ? <Spinner/> : 'Extraer'}
          </Button>
          <Button type="button" disabled={distilling} onClick={distill}
                  className={clsx(
                    'transition ease-in-out duration-300',
                    'relative -ml-px inline-flex items-center rounded-r-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10'
                  )}>
            {distilling ? <Spinner/> : 'Destilar'}
          </Button>
        </span>
      </div>
    </>
);
}
