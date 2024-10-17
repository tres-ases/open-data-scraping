import {ChevronRightIcon} from "@heroicons/react/24/outline";
import {ProyectoRaw} from "@senado-cl/global/model";
import {Link} from "react-router-dom";

interface Props {
  proyecto: ProyectoRaw
}

export default function ProyectoDetalles({proyecto}: Props) {
  return (
    <>
      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
        <div className="flex pt-4 mx-4">
          <div className="flex-auto">
            <nav aria-label="Breadcrumb" className="flex">
              <ol role="list" className="flex items-center space-x-2">
                <li>
                  <div className="flex items-center">
                    <Link to="/senadores" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                      Proyectos
                    </Link>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <ChevronRightIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-gray-400"/>
                    <p className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                      Proyecto
                    </p>
                  </div>
                </li>
              </ol>
            </nav>
            <div
              className=" lg:grid lg:grid-cols-2">
              <div className="lg:max-w-lg lg:self-end">
                <div className="mt-4">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    {proyecto.descripcion.boletin} - Ley N° {proyecto.descripcion.leyNumero}
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
