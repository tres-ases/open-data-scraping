import {ChevronRightIcon} from "@heroicons/react/24/outline";
import {ProyectoRaw} from "@senado-cl/global/model";
import {Link} from "react-router-dom";
import ProyectoDetallesDescripcion from "./ProyectoDetallesDescripcion.tsx";
import ProyectoDetallesAdjuntos from "./ProyectoDetallesAdjuntos.tsx";
import ProyectoDetallesTimeline from "./ProyectoDetallesTimeline.tsx";

interface Props {
  proyecto: ProyectoRaw
}

export default function ProyectoDetalles({proyecto: {descripcion, informes, oficios, tramitaciones, materias}}: Props) {
  return (
    <>
      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
        <div className="flex pt-4 mx-4">
          <div className="flex-auto">
            <nav aria-label="Breadcrumb" className="flex">
              <ol role="list" className="flex items-center space-x-2">
                <li>
                  <div className="flex items-center">
                    <Link to="/proyectos" className="text-sm font-medium text-gray-500 hover:text-gray-700">
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
            <ProyectoDetallesDescripcion descripcion={descripcion} materias={materias}/>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow mt-6">
        <div className="flex mx-4">
          <ProyectoDetallesAdjuntos linkMensajeMocion={descripcion.linkMensajeMocion} informes={informes}/>
        </div>
      </div>
      <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow mt-6">
        <div className="flex mx-4 my-6">
          <ProyectoDetallesTimeline informes={informes} oficios={oficios} tramitaciones={tramitaciones}/>
        </div>
      </div>
    </>
  );
}
