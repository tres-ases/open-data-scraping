import {ProyectosMapRaw} from "@senado-cl/global/model";
import {Button} from "@headlessui/react";
import clsx from "clsx";
import ProyectosListItem from "./ProyectosListItem.tsx";
import ProyectosListItemLoading from "./ProyectosListItemLoading.tsx";

interface Props {
  map?: ProyectosMapRaw
}

export default function ProyectosList({map}: Props) {
  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div>
        <div className="pt-5 px-6 pb-3">
          <div className="flex pb-2">
            <div className="flex-auto">
              <h3 className="text-base font-semibold leading-7 text-gray-900">
                Listado de Proyectos
              </h3>
            </div>
            <div className="flex-none">
              <Button type="button"
                      className={clsx(
                        'transition ease-in-out duration-300 ring-1 ring-inset ring-gray-250 hover:bg-gray-50 text-gray-800 hover:text-gray-900 hover:ring-gray-300',
                        'relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50 focus:z-10'
                      )}>
                Extraer Listado
              </Button>
            </div>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            La tramitación de un proyecto de ley puede iniciarse tanto en la Cámara de Diputados como en el Senado. La
            primera que estudia el proyecto recibe el nombre de Cámara de Origen, en tanto la otra pasa a constituirse
            como la Cámara Revisora.
          </p>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {map ? Object.keys(map).map(bolId => (
            <ProyectosListItem key={bolId} data={map[bolId]}/>
          )) : [1, 2, 3, 4, 5].map(index => (
            <ProyectosListItemLoading key={index}/>
          ))}
        </ul>
      </div>
    </div>
  )
    ;
}
