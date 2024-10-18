import {PaperClipIcon} from "@heroicons/react/24/outline";
import {ProyectoInformeRaw} from "@senado-cl/global/model";

interface Props {
  linkMensajeMocion: string
  informes: ProyectoInformeRaw[]
}

export default function ProyectoDetallesAdjuntos({
                                                   linkMensajeMocion,
                                                   informes
                                                 }: Props) {
  return (
    <>
      <dl className="flex-auto">
        <div className="border-t border-gray-100 px-4 py-6 sm:px-0">
          <dt className="text-base font-semibold leading-7 text-gray-900 mb-6">Documentos Adjuntos</dt>
          <dd className="mt-2 text-sm text-gray-900">
            <ul role="list" className="divide-y divide-gray-100 rounded-md border border-gray-200">
              <li className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6">
                <div className="flex w-0 flex-1 items-center">
                  <PaperClipIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-gray-400"/>
                  <div className="ml-4 flex min-w-0 flex-1 gap-2">
                    <span className="truncate font-medium">Mensaje moción</span>
                  </div>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <a target="_blank" href={linkMensajeMocion}
                     className="font-medium text-indigo-600 hover:text-indigo-500">
                    Descargar
                  </a>
                </div>
              </li>
              {informes.map(({fecha, etapa, link, tramite}, idx) => (
                <li key={idx} className="flex items-center justify-between py-4 pl-4 pr-5 text-sm leading-6">
                  <div className="flex w-0 flex-1 items-center">
                    <PaperClipIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-gray-400"/>
                    <div className="ml-4 flex min-w-0 flex-1 gap-2">
                      <span>
                        <p className="truncate font-medium">{etapa} - {fecha}</p>
                        <p className="truncate font-normal text-xs">{tramite}</p>
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                  <a target="_blank" href={link}
                       className="font-medium text-indigo-600 hover:text-indigo-500">
                      Descargar
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </>
  );
}
