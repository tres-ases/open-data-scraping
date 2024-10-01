import {VotacionRaw} from "@senado-cl/global/sesiones";
import clsx from "clsx";

interface Props {
  votacion: VotacionRaw
}

export default function SesionVotacionItem({votacion}: Props) {
  const {hora, boletin, quorum, tema, detalle} = votacion;

  const items = [
    {nombre: 'Apruebo', votos: detalle.si === 0 ? 0 : detalle.si.length},
    {nombre: 'Rechazo', votos: detalle.no === 0 ? 0 : detalle.no.length},
    {nombre: 'Abstención', votos: detalle.abstencion === 0 ? 0 : detalle.abstencion.length},
    {nombre: 'Pareo', votos: detalle.pareo === 0 ? 0 : detalle.pareo.length},
  ];
  const total = items.reduce((acc, curr) => acc + curr.votos, 0)

  return (
    <li className="group gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
      <div className="flex min-w-0 gap-x-4">
        <div className="min-w-0 flex-auto">
          <p className="text-sm font-semibold leading-6 text-gray-900">
            {boletin ? `Boletin ${boletin}` : 'Sin boletin'} - {quorum}
          </p>
          <p className="text-xs font-semibold leading-6 text-gray-500">
            {hora}
          </p>
          <p className="mt-1 flex text-sm leading-5 text-gray-400">
            {tema}
          </p>
        </div>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {items.map((item, idx) => (
          <div key={idx} className="relative px-4 pb-2 sm:pt-6">
            <dt>
              <p className={
                clsx(
                  'truncate text-sm font-semibold',
                  {
                    'text-emerald-400 group-hover:text-emerald-500': idx === 0,
                    'text-rose-300 group-hover:text-rose-400': idx === 1,
                    'text-orange-300 group-hover:text-orange-400': idx === 2,
                    'text-gray-300 group-hover:text-gray-400': idx > 2,

                  }
                )
              }>
                {item.nombre}
              </p>
            </dt>
            <dd className="flex items-baseline pb-2">
              <p className={clsx(
                'text-2xl font-semibold',
                {
                  'text-emerald-500 group-hover:text-emerald-600': idx === 0,
                  'text-rose-400 group-hover:text-rose-500': idx === 1,
                  'text-orange-400 group-hover:text-orange-500': idx === 2,
                  'text-gray-400 group-hover:text-gray-500': idx > 2,

                }
              )}>{item.votos}</p>
              <p className="ml-2 flex items-baseline text-sm font-semibold text-gray-400">
                {(100*item.votos/total).toFixed(1)} %
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
}
