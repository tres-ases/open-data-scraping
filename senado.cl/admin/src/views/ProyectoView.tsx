import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import {ProyectoRaw} from "@odata-senado.cl/model";
import ProyectosService from "../services/proyectos.service.ts";
import ProyectoLoading from "../components/ProyectoLoading.tsx";
import ProyectoError from "../components/ProyectoError.tsx";
import ProyectoDetalles from "../components/ProyectoDetalles.tsx";

export default function ProyectoView() {
  const {bolId} = useParams();
  const [proyecto, setProyecto] = useState<ProyectoRaw | null>()

  useEffect(() => {
    setProyecto(undefined);
    if (bolId) {
      ProyectosService.getRaw(bolId)
        .then(proyecto => setProyecto(proyecto))
        .catch(() => setProyecto(null));
    }
  }, [bolId]);

  if (proyecto === undefined) {
    return <ProyectoLoading/>
  } else if (proyecto === null) {
    return <ProyectoError/>
  } else {
    return <ProyectoDetalles proyecto={proyecto}/>
  }
}
