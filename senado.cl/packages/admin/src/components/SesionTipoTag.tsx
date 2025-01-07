import {SesionTipo} from "@odata-senado.cl/model";

const sesionTipoColor: { [key in SesionTipo]: string } = {
  'Ordinaria': 'text-yellow bg-yellow-50 ring-yellow-600/20',
  'Extraordinaria': 'text-green bg-green-50 ring-green-600/20',
  'Especial': 'text-blue bg-blue-50 ring-blue-600/20',
  'Congreso pleno': 'text-red bg-red-50 ring-red-600/20',
}

interface Props {
  tipo: SesionTipo
}

export default function SesionTipoTag({tipo}: Props) {
  const color = sesionTipoColor[tipo] ? sesionTipoColor[tipo] : 'gray';
  return <p
    className={`text-${color}-700 bg-${color}-50 ring-${color}-600/20 mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset`}>
    {tipo}
  </p>
}


