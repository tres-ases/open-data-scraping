import {BuildingLibraryIcon, ChevronRightIcon, EnvelopeIcon, PhoneIcon} from "@heroicons/react/24/outline";
import {SenadorRaw} from "@senado-cl/global/model";
import {Link} from "react-router-dom";

interface Props {
  senador: SenadorRaw
}

export default function SenadorDetalles({senador}: Props) {
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
                      Senadores
                    </Link>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <ChevronRightIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-gray-400"/>
                    <p className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                      Senador
                    </p>
                  </div>
                </li>
              </ol>
            </nav>
            <div
              className=" lg:grid lg:grid-cols-2">
              {/* Product details */}
              <div className="lg:max-w-lg lg:self-end">
                <div className="mt-4">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    {senador.nombreCompleto}
                  </h1>
                </div>

                <section aria-labelledby="information-heading" className="mt-1">
                  <h2 id="information-heading" className="sr-only">
                    Información Senador
                  </h2>
                  <div className="flex items-center">
                    <p className="text-lg text-gray-900 sm:text-xl">{senador.partido.nombre}</p>
                  </div>
                  <div>
                    <p className="text-base text-gray-500">{senador.region.nombre}</p>
                  </div>
                  <div className="mt-4 flex items-center">
                    <PhoneIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-indigo-500"/>
                    <p className="ml-2 text-sm text-gray-500">{senador.fono ?? 'Sin información'}</p>
                  </div>
                  <div className="mt-2 flex items-center">
                    <EnvelopeIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-indigo-500"/>
                    <p className="ml-2 text-sm text-gray-500">{senador.email ?? 'Sin información'}</p>
                  </div>
                  {senador && (
                    <div className="mt-2 flex items-center">
                      <BuildingLibraryIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-indigo-500"/>
                      <a target="_blank" className="ml-2 text-sm text-gray-500 hover:underline"
                         href={`https://www.senado.cl/senadoras-y-senadores/listado-de-senadoras-y-senadores/${senador.slug}`}>
                        Ver perfil en senado.cl
                      </a>
                    </div>
                  )}
                </section>
              </div>

              <div className="mt-10 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-center">
                <div className="aspect-h-1 aspect-w-1 overflow-hidden rounded-lg">
                  <img alt="senador.nombre" src={`/img/senador/${senador.id}/default.jpg`}
                       className="h-1/2 w-1/2 object-cover object-center"/>
                </div>
              </div>

              <section className="mt-12">
                <h2 className="text-base font-semibold leading-6 text-gray-900">Períodos</h2>
                <ol className="mt-2 divide-y divide-gray-200 text-sm leading-6 text-gray-500">
                  {senador.periodos.map(({camara, desde, hasta, vigente}) => (
                    <li className="py-4 sm:flex">
                      <p className="w-28 flex-none">
                        {desde} - {hasta}
                      </p>
                      <p className="mt-2 flex-auto font-semibold text-gray-900 sm:mt-0">
                        {camara === 'S' ? 'Cámara de Senadoras y senadores' : 'Cámara de Diputadas y Diputados'}
                      </p>
                      {vigente === 1 && (
                        <p className="flex-none sm:ml-6">
                          Vigente
                        </p>
                      )}

                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
