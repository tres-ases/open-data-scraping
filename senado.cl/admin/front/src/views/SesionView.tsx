import {useEffect, useState} from "react";
import {useParams, useSearchParams} from "react-router-dom";
import {LegislaturaSesionDtl} from "@senado-cl/global/sesiones";
import SesionesService from "../services/sesiones.service.ts";
import SesionDetalle from "../components/SesionDetalle.tsx";
import SesionAsistencia from "../components/SesionAsistencia.tsx";
import SesionVotaciones from "../components/SesionVotaciones.tsx";
import {Tab, TabGroup, TabList, TabPanel, TabPanels} from "@headlessui/react";
import clsx from "clsx";
import SesionDetalleLoading from "../components/SesionDetalleLoading.tsx";

export default function SesionView() {
  let params = useParams();
  let {sesId} = params;
  const [data, setData] = useState<LegislaturaSesionDtl>();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (sesId) {
      SesionesService.getDtl(sesId)
        .then(sesion => setData(sesion));
    }
  }, [sesId]);

  useEffect(() => {
    if (searchParams.get('pestana') !== 'votaciones') {
      setSearchParams({pestana: 'asistencia'});
    }
  }, [searchParams]);

  const pestana = searchParams.get('pestana');

  return (
    <>
      {data ? <SesionDetalle sesion={data}/> : <SesionDetalleLoading/>}
      <TabGroup defaultIndex={pestana === 'votaciones' ? 1 : 0} onChange={idx => setSearchParams({pestana: idx === 0 ? 'asistencia' : 'votaciones'})}>
        <TabList className="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 mx-4 mt-6 mb-3">
          <Tab className={clsx(
                 pestana === 'asistencia' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700',
                 'rounded-md px-3 py-2 text-sm font-medium',
               )}>
            Asistencia
          </Tab>
          <Tab className={clsx(
                 pestana === 'votaciones' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700',
                 'rounded-md px-3 py-2 text-sm font-medium',
               )}>
            Votaciones
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <SesionAsistencia sesId={sesId as string}/>
          </TabPanel>
          <TabPanel>
            <SesionVotaciones sesId={sesId as string}/>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </>
  );
}
