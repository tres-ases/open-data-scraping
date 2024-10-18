import {ProyectoInformeRaw, ProyectoOficioRaw, ProyectoTramiteRaw} from "@senado-cl/global/model";
import {ReactElement} from "react";
import {BookOpenIcon, BriefcaseIcon, DocumentTextIcon} from "@heroicons/react/24/outline";
import moment from "moment";
import clsx from "clsx";

interface Evento {
  tipo: 'Oficio' | 'Informe' | 'Tramitación'
  fecha: moment.Moment
  titulo: string
  subtitulo?: string
  contenido?: ReactElement
  link?: string
}

interface Props {
  oficios: ProyectoOficioRaw[]
  informes: ProyectoInformeRaw[]
  tramitaciones: ProyectoTramiteRaw[]
}

export default function ProyectoDetallesTimeline({oficios, informes, tramitaciones}: Props) {

  const eventos: Evento[] = [];
  for (const {fecha, tramite, etapa} of oficios) {
    eventos.push({
      tipo: 'Oficio',
      fecha: moment(fecha, 'DD/MM/YYYY'),
      titulo: tramite,
      subtitulo: etapa,
    });
  }
  for (const {fecha, tramite, etapa, link} of informes) {
    eventos.push({
      tipo: 'Informe',
      fecha: moment(fecha, 'DD/MM/YYYY'),
      titulo: etapa,
      subtitulo: tramite,
      link,
    });
  }
  for (const {fecha, etapaDescripcion, descripcionTramite} of tramitaciones) {
    eventos.push({
      tipo: 'Tramitación',
      fecha: moment(fecha, 'DD/MM/YYYY'),
      titulo: etapaDescripcion,
      subtitulo: descripcionTramite
    });
  }

  return (
    <>
      <div className="grid grid-cols-1">
        <div className="flex">
          <h1 className="flex-auto text-base font-semibold leading-7 text-gray-900 mb-6">Línea de Tiempo</h1>
          <div className="flex-none mr-3">
            <span
              className="inline-flex items-center gap-x-1.5 rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-600">
              <svg viewBox="0 0 6 6" aria-hidden="true" className="h-1.5 w-1.5 fill-indigo-400">
                <circle r={3} cx={3} cy={3}/>
              </svg>
              Oficio
            </span>
          </div>
          <div className="flex-none mr-3">
            <span
              className="inline-flex items-center gap-x-1.5 rounded-full bg-cyan-100 px-2 py-1 text-xs font-medium text-cyan-600">
              <svg viewBox="0 0 6 6" aria-hidden="true" className="h-1.5 w-1.5 fill-cyan-400">
                <circle r={3} cx={3} cy={3}/>
              </svg>
              Informe
            </span>
          </div>
          <div className="flex-none">
            <span
              className="inline-flex items-center gap-x-1.5 rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-600">
              <svg viewBox="0 0 6 6" aria-hidden="true" className="h-1.5 w-1.5 fill-rose-400">
                <circle r={3} cx={3} cy={3}/>
              </svg>
              Tramitación
            </span>
          </div>
        </div>
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {eventos
              .sort((a, b) => a.fecha.isBefore(b.fecha) ? 1 : -1)
              .map(({tipo, fecha, titulo, subtitulo, contenido, link}, index) => (
                <li key={index}>
                  <div className="flex">
                    <div className="flex-auto relative pb-8">
                      {index !== eventos.length - 1 ? (
                        <span aria-hidden="true" className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"/>
                      ) : null}
                      <div className="relative flex items-start space-x-3">
                        <div className="relative px-1">
                          <div className="flex h-8 w-8 items-center justify-center">
                            {tipo === 'Oficio' ? (
                              <DocumentTextIcon aria-hidden="true"
                                                className="size-5 rounded-lg bg-indigo-100 text-indigo-600"/>
                            ) : undefined}
                            {tipo === 'Informe' ? (
                              <BookOpenIcon aria-hidden="true" className="size-5 rounded-lg bg-cyan-100 text-cyan-700"/>
                            ) : undefined}
                            {tipo === 'Tramitación' ? (
                              <BriefcaseIcon aria-hidden="true"
                                             className="size-5 rounded-lg bg-rose-100 text-rose-600"/>
                            ) : undefined}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div>
                            <p className={clsx("font-semibold text-base",
                              tipo === 'Oficio' && 'text-indigo-800',
                              tipo === 'Informe' && 'text-cyan-900',
                              tipo === 'Tramitación' && 'text-rose-800',
                            )}>
                              {titulo}
                            </p>
                            {subtitulo && (
                              <p className={clsx("font-normal text-sm",
                                tipo === 'Oficio' && 'text-indigo-600',
                                tipo === 'Informe' && 'text-cyan-700',
                                tipo === 'Tramitación' && 'text-rose-600',
                              )}>
                                {subtitulo}
                              </p>
                            )}
                            <div className="mt-0.5 text-sm text-gray-500">
                              {fecha.format('DD/MM/YYYY')} <span className="text-gray-400">- {fecha.fromNow()}</span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-700">
                            <p>{contenido}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {link && (
                      <div className="flex-none">
                        <a target="_blank" href={link}
                           className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 shadow-sm hover:bg-gray-200">
                          Enlace
                        </a>
                      </div>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </>
  );
}
