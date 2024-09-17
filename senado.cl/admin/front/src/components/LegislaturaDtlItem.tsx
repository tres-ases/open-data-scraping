import {LegislaturaDtl, TipoLegislatura} from "@senado-cl/global/legislaturas";
import {Link} from "react-router-dom";

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
  data: LegislaturaDtl
}

export default function LegislaturaDtlItem({data}: Props) {
  const {id, numero, tipo, inicio, termino} = data;
  return (
    <>
      <div className="min-w-0">
        <div className="flex items-start gap-x-3">
          <p className="text-sm font-semibold leading-6 text-gray-900">N° {numero}</p>
          {tipoLegislatura(tipo)}
        </div>
        <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
          <p className="whitespace-nowrap">
            <time dateTime={inicio}>{inicio}</time> - <time dateTime={termino}>{termino}</time>
          </p>
          <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
            <circle r={1} cx={1} cy={1}/>
          </svg>
          <p className="truncate">(Id: {id})</p>
        </div>
      </div>
      <div className="flex flex-none items-center gap-x-4">
        <Link
          to={`/legislatura/${id}`}
          className="transition ease-in-out duration-300 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-50 hover:bg-gray-50 text-gray-200 group-hover:text-gray-900 group-hover:ring-gray-300"
        >
          Detalles
        </Link>
      </div>
    </>
  );
}
