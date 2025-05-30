import {useEffect, useState} from "react";
import {ProyectosMapDtl} from "@odata-senado.cl/model";
import ProyectosService from "../services/proyectos.service.ts";
import ProyectosError from "../components/ProyectosError.tsx";
import ProyectosList from "../components/ProyectosList.tsx";

export default function ProyectosView() {

  const [proyectosMap, setProyectosMap ] = useState<ProyectosMapDtl | null>();

  useEffect(() => {
    ProyectosService.getDtlMap()
      .then(map => setProyectosMap(map))
  }, []);

  if (proyectosMap === null) {
    return <ProyectosError/>
  } else {
    return <ProyectosList map={proyectosMap}/>
  }
}
