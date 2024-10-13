import {SenadorMapRaw} from "@senado-cl/global/model";
import SenadoresListItem from "./SenadoresListItem.tsx";
import {Button} from "@headlessui/react";
import clsx from "clsx";

interface Props {
  map: SenadorMapRaw
}

export default function SenadoresList({map}: Props) {
  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div>
        <div className="pt-5 px-6 pb-3">
          <div className="flex pb-2">
            <div className="flex-auto">
              <h3 className="text-base font-semibold leading-7 text-gray-900">
                Listado de Senadores
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
            El Senado está conformado por 50 integrantes, elegidos en votación directa por 16 circunscripciones
            senatoriales, quienes permanecen ocho años en el cargo.
          </p>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {Object.keys(map).map(slug => (
            <SenadoresListItem key={slug} slug={slug} data={map[slug]}/>
          ))}
        </ul>
      </div>
    </div>
  )
    ;
}
