import {ProyectoDtl} from "@odata-senado.cl/model";
import {Link} from "react-router-dom";

interface Props {
  data: ProyectoDtl
}

export default function ProyectosListItem({
                                            data: {
                                              boletin, titulo, etapa, subEtapa,
                                              resumen: {votaciones},
                                              materias
                                            }
}: Props) {
  const boletinLimpio = boletin.indexOf('-') > 0 ? boletin.split('-')[0].replace(/\D/g, '') : boletin;

  return (
    <li className="gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
      <div className="flex items-start min-w-0 gap-x-4">
        <div className="min-w-0 flex-auto">
          <div className="text-sm font-semibold leading-6 text-gray-900">
            <Link to={`/proyecto/${boletinLimpio}`}>
              <span className="absolute inset-x-0 -top-px bottom-0"/>
              Boletín {boletin}
            </Link>
          </div>
          <p className="text-xs font-normal leading-6 text-indigo-500">
            {etapa} | {subEtapa}
          </p>
          <p className="text-sm font-normal leading-6 text-gray-700">
            {titulo}
          </p>
          {votaciones > 0 && (
            <p className="text-xs font-light leading-6 text-cyan-600">
              {votaciones} {votaciones === 1 ? 'votación' : 'votaciones'}
            </p>
          )}
        </div>
        <div>
          <p className="mt-1 flex text-xs leading-5 text-gray-400">
          <a target="_blank" className="relative truncate hover:underline"
               href={`https://tramitacion.senado.cl/wspublico/tramitacion.php?boletin=${boletinLimpio}`}>
              Ver XML
            </a>
          </p>
        </div>
      </div>
      <div className="mt-1">
        {materias.map((materia, index) => (
          <span key={index}
                className="inline-flex items-center rounded-md bg-rose-50 px-2 py-1 text-xs font-light text-rose-500 ring-1 ring-inset ring-rose-200 mr-2 mb-1">
                {materia}
              </span>
        ))}
      </div>
    </li>
  );
}
