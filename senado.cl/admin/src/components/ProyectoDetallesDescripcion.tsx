import {ProyectoDescripcionRaw} from "@odata-senado.cl/model";

interface Props {
  descripcion: ProyectoDescripcionRaw
  materias: string[]
}

export default function ProyectoDetallesDescripcion({
                                                      descripcion: {
                                                        boletin,
                                                        leyNumero,
                                                        estado,
                                                        etapa,
                                                        subEtapa,
                                                        camaraOrigen,
                                                        fechaIngreso,
                                                        diarioOficial,
                                                        titulo,
                                                        urgenciaActual
                                                      }, materias
                                                    }: Props) {
  return (
    <>
      <div className="mt-6">
        <div className="px-4 sm:px-0">
          <h3 className="text-base font-semibold leading-7 text-gray-900">Boletín {boletin}</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">Ingresado el {fechaIngreso}</p>
        </div>
        <div className="mt-3">
          {materias.map((materia, index) => (
            <span key={index}
                  className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/10 mr-2 mb-1">
                {materia}
              </span>
          ))}
        </div>
        <div className="mt-4">
          <dl className="grid grid-cols-1 sm:grid-cols-2">
            <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Ley Número</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2">{leyNumero ?? 'Sin definir'}</dd>
            </div>
            <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Cámara Origen</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2">{camaraOrigen}</dd>
            </div>
            <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Urgencia Actual</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2">{urgenciaActual}</dd>
            </div>
            <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Estado</dt>
              <dd
                className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2">{estado} {diarioOficial ? `(Diario Oficial ${diarioOficial})` : ''}</dd>
            </div>
            <div className="border-t border-gray-100 px-4 py-6 sm:col-span-2 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Título</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2">{titulo}</dd>
            </div>
            <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Etapa | Subetapa</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2">{etapa} | {subEtapa}</dd>
            </div>
            <div className="border-t border-gray-100 px-4 py-6 sm:col-span-1 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Iniciativa</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:mt-2">{camaraOrigen}</dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
