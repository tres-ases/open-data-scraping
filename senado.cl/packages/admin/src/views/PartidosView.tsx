import {useEffect, useState} from "react";
import {PartidosMapDtl} from "@odata-senado.cl/model";
import PartidosService from "../services/partidos.service.ts";
import PartidosList from "../components/PartidosList.tsx";

export default function PartidosView() {

  const [partidosMapDtl, setPartidosMapDtl] = useState<PartidosMapDtl | null>();

  useEffect(() => {
    PartidosService.getDtlMap()
      .then(map => setPartidosMapDtl(map))
  }, []);

  if (partidosMapDtl) console.log(partidosMapDtl);

  if (partidosMapDtl === null) {
    return <>Error</>
  } else {
    return <PartidosList map={partidosMapDtl}/>
  }
}
