import {useEffect, useState} from "react";
import SenadoresService from "../services/senadores.service.ts";

export default function Senadores() {

  const [senadores, setSenadores] = useState<any[]>([]);

  useEffect(() => {
    SenadoresService.getAll()
      .then(senadores => setSenadores(senadores) );
  }, [])

  return (
    <>
      <div className="md:flex md:items-center md:justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Senadores</h2>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4 md:gap-y-0 lg:gap-x-8">
        {senadores.slice(0,20).map(s => (
          <div key={s.id} className="group relative">
            <div className="h-56 w-full overflow-hidden rounded-md bg-gray-200 group-hover:opacity-75 lg:h-72 xl:h-80">
              <img
                alt={s.nombre}
                src={`/Senadores/Detalle/Foto/parlId=${s.id}/1.jpeg`}
                className="h-full w-full object-cover object-center"
              />
            </div>
            <h3 className="mt-4 text-sm text-gray-700">
              <a href={`/senadores/${s.id}`}>
                <span className="absolute inset-0"/>
                {s.nombre}
              </a>
            </h3>
            <p className="mt-1 text-sm text-indigo-600 font-light">{s.periodos.length} período{s.periodos.length > 1 ? 's' : ''}</p>
            <p className="mt-1 text-sm font-medium text-gray-700">{s.periodos.map((p: any) => `${p.rango.inicio}-${p.rango.fin}`).join(' | ')}</p>
          </div>
        ))}
      </div>
    </>
  )
    ;
}
