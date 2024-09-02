import {useParams} from "react-router-dom";
import {BuildingLibraryIcon, EnvelopeIcon, PhoneIcon} from "@heroicons/react/24/outline";
import SenadorGastosOperacionales from "../components/SenadorGastosOperacionales.tsx";

export default function Senador() {
  let params = useParams();
  let { id } = params;

  return (
    <>
      <div className="bg-white mb-8">
        <div
          className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
          {/* Product details */}
          <div className="lg:max-w-lg lg:self-end">
            <div className="mt-4">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">senador.nombre</h1>
            </div>

            <section aria-labelledby="information-heading" className="mt-1">
              <h2 id="information-heading" className="sr-only">
                Información Senador
              </h2>

              <div className="flex items-center">
                <p className="text-lg text-gray-900 sm:text-xl">senador.partido</p>
              </div>

              <div>
                <p className="text-base text-gray-500">senador.region</p>
              </div>

              <div className="mt-4 flex items-center">
                <PhoneIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-indigo-500"/>
                <p
                  className="ml-2 text-sm text-gray-500">senador.telefono</p>
              </div>
              <div className="mt-2 flex items-center">
                <EnvelopeIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-indigo-500"/>
                <p
                  className="ml-2 text-sm text-gray-500">senador.correo</p>
              </div>
              <div className="mt-2 flex items-center">
                <BuildingLibraryIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-indigo-500"/>
                <a href={`https://tramitacion.senado.cl/appsenado/index.php?mo=senadores&ac=fichasenador&id=${id}`}
                   target="_blank" className="ml-2 text-sm text-gray-500">Ficha Senado</a>
              </div>
            </section>
          </div>

          <div className="mt-10 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-center">
            <div className="aspect-h-1 aspect-w-1 overflow-hidden rounded-lg">
              <img alt="senador.nombre" src={`/Senadores/Detalle/Foto/parlId=${id}/1.jpeg`} className="h-1/2 w-1/2 object-cover object-center"/>
            </div>
          </div>
        </div>
      </div>
      {id && <SenadorGastosOperacionales id={id}/>}
    </>
  );
}
