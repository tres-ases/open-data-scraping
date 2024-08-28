import {useEffect, useState} from "react";
import {CheckIcon} from '@heroicons/react/20/solid'
import SenadoresService from "../services/senadores.service.ts";
import {ParlamentarioDetalle} from "@senado-cl/global/senadores";
import {useParams} from "react-router-dom";
import {EnvelopeIcon, PhoneIcon} from "@heroicons/react/24/outline";

const product = {
  name: 'Everyday Ruck Snack',
  href: '#',
  price: '$220',
  description:
    "Don't compromise on snack-carrying capacity with this lightweight and spacious bag. The drawstring top keeps all your favorite chips, crisps, fries, biscuits, crackers, and cookies secure.",
  imageSrc: 'https://tailwindui.com/img/ecommerce-images/product-page-04-featured-product-shot.jpg',
  imageAlt: 'Model wearing light green backpack with black canvas straps and front zipper pouch.',
  breadcrumbs: [
    { id: 1, name: 'Travel', href: '#' },
    { id: 2, name: 'Bags', href: '#' },
  ],
  sizes: [
    { name: '18L', description: 'Perfect for a reasonable amount of snacks.' },
    { name: '20L', description: 'Enough room for a serious amount of snacks.' },
  ],
}

export default function Senador() {
  const [senador, setSenador] = useState<ParlamentarioDetalle>();
  let params = useParams();
  console.log(params)
  let { id } = params;

  useEffect(() => {
    id && SenadoresService.getOne(id)
      .then(senador => setSenador(senador));
  }, [id])

  console.log(id, senador);

  return senador ? (
    <>
      <div className="bg-white">
        <div
          className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
          {/* Product details */}
          <div className="lg:max-w-lg lg:self-end">
            <div className="mt-4">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{senador.nombre}</h1>
            </div>

            <section aria-labelledby="information-heading" className="mt-4">
              <h2 id="information-heading" className="sr-only">
                Información Senador
              </h2>

              <div className="flex items-center">
                <p className="text-lg text-gray-900 sm:text-xl">{senador.partido}</p>
              </div>

              <div className="mt-4 space-y-6">
                <p className="text-base text-gray-500">{senador.region}</p>
              </div>

              <div className="mt-6 flex items-center">
                <PhoneIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-indigo-500"/>
                <p
                  className="ml-2 text-sm text-gray-500">{senador.telefono && senador.telefono.length > 0 ? senador.telefono : 'sin información'}</p>
              </div>

              <div className="mt-6 flex items-center">
                <EnvelopeIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-indigo-500"/>
                <p
                  className="ml-2 text-sm text-gray-500">{senador.correo && senador.correo.length > 0 ? senador.correo : 'sin información'}</p>
              </div>
            </section>
          </div>

          <div className="mt-10 lg:col-start-2 lg:row-span-2 lg:mt-0 lg:self-center">
            <div className="aspect-h-1 aspect-w-1 overflow-hidden rounded-lg">
              <img alt={senador.nombre} src={`/Senadores/Detalle/Foto/parlId=${id}/1.jpeg`} className="h-full w-full object-cover object-center"/>
            </div>
          </div>
        </div>
      </div>
    </>
  ) : <></>;
}
