import {useEffect, useState} from "react";
import {useParams, useSearchParams} from "react-router-dom";
import {SesionRaw} from "@senado-cl/global/sesiones";
import SesionesService from "../services/sesiones.service.ts";
import SesionDetalle from "../components/SesionDetalle.tsx";
import SesionAsistencia from "../components/SesionAsistencia.tsx";
import SesionVotaciones from "../components/SesionVotaciones.tsx";

export default function SesionView() {
  let params = useParams();
  let { sesId } = params;
  const [sesion, setSesion] = useState<SesionRaw>();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    sesId && SesionesService.getOne(sesId)
      .then(sesion => setSesion(sesion));
  }, [sesId]);

  useEffect(() => {
    if (searchParams.get('pestana') !== 'votacion') {
      setSearchParams({pestana: 'asistencia'});
    }
  }, [searchParams]);

  const pestana = searchParams.get('pestana');

  return (
    <>
      {sesion && <SesionDetalle sesion={sesion}/>}
      <nav className="flex space-x-4 px-4 pb-2 pt-4">
        <a
          className={`cursor-pointer ${pestana === 'asistencia' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'} rounded-md px-3 py-2 text-sm font-medium`}
          onClick={() => setSearchParams({pestana: 'asistencia'})}>
          Asistencia
        </a>
        <a className={`cursor-pointer ${pestana === 'votacion' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'} rounded-md px-3 py-2 text-sm font-medium`}
          onClick={() => setSearchParams({pestana: 'votacion'})}>
          Votacion
        </a>
      </nav>
      {sesion && pestana === 'asistencia' && <SesionAsistencia asistencia={sesion.asistencia}/>}
      {sesion && pestana === 'votacion' && <SesionVotaciones votaciones={sesion.votaciones}/>}
    </>
  );
}
