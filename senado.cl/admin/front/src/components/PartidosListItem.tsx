import {PartidoDtl} from "@senado-cl/global/model";
import {Link} from "react-router-dom";
import {Disclosure, DisclosureButton, DisclosurePanel} from "@headlessui/react";
import clsx from "clsx";

interface Props {
  data: PartidoDtl
}

export default function PartidosListItem({data: {nombre, senadores}}: Props) {

  return (
    <li className="gap-x-6 px-4 py-3 hover:bg-gray-50 sm:px-6">
      <Disclosure as="div" className="w-full">
        <DisclosureButton className="w-full text-left">
          <div className="text-sm font-semibold leading-6 text-gray-900">
            {nombre}
          </div>
          <p className="text-xs font-normal leading-6 text-indigo-500">
            {senadores.length} senador{senadores.length !== 1 && 'es'}
          </p>
        </DisclosureButton>
        <div className="overflow-hidden">
          <DisclosurePanel transition className={
            clsx("origin-top transition duration-200 ease-out data-[closed]:-translate-y-6 data-[closed]:opacity-0",
              "grid grid-cols-4 gap-4 my-2")
          }>
            {senadores.map(({nombreCompleto, slug}) => (
              <div key={slug}>
                <Link to={`/senador/${slug}`} className="group block shrink-0">
                  <div className="flex items-center">
                    <div>
                      <img
                        alt={nombreCompleto}
                        src={`/img/senador/${slug}/120x120.jpg`}
                        className="inline-block h-9 w-9 rounded-full"
                      />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{nombreCompleto}</p>
                      <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">Ver perfil</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </DisclosurePanel>
        </div>
      </Disclosure>

    </li>
  );
}
