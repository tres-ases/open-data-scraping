import {AsistenciaTipo} from "@odata-senado.cl/model";

const asistenciaTipoClazz: { [key in AsistenciaTipo]: string } = {
  'Asiste': 'text-blue bg-blue-50 ring-blue-600/20',
  'Ausente': 'text-yellow bg-yellow-50 ring-yellow-600/20',
}

interface Props {
  tipo: AsistenciaTipo
  justificacion: string | null
}

export default function AsistenciaTipoTag({justificacion, tipo}: Props) {
  const clazz = tipo === 'Ausente' && justificacion === null ? 'text-red bg-red-50 ring-red-600/20' : asistenciaTipoClazz[tipo];
  return <p
    className={`${clazz} mt-0.5 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset`}>
    {tipo}{tipo === 'Ausente' && justificacion === null ? ' sin justificación' : ''}
  </p>
}


