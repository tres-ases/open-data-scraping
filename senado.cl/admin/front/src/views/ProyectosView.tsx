import {useEffect, useState} from "react";
import {ProyectosMapRaw} from "@senado-cl/global/model";
import ProyectosService from "../services/proyectos.service.ts";
import ProyectosLoading from "../components/ProyectosLoading.tsx";
import ProyectosError from "../components/ProyectosError.tsx";
import ProyectosList from "../components/ProyectosList.tsx";

export default function ProyectosView() {

  const [proyectosMap, setProyectosMap ] = useState<ProyectosMapRaw | null>();

  useEffect(() => {
    ProyectosService.getRawMap()
      .then(map => setProyectosMap(map))
  }, []);

  if(proyectosMap === undefined) {
    return <ProyectosLoading/>
  } else if (proyectosMap === null) {
    return <ProyectosError/>
  } else {
    return <ProyectosList map={proyectosMap}/>
  }
}