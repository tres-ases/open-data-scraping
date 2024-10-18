import {useEffect, useState} from "react";
import SenadorService from "../services/senadores.service.ts";
import {SenadoresMapRaw} from "@senado-cl/global/model";
import SenadoresError from "../components/SenadoresError.tsx";
import SenadoresList from "../components/SenadoresList.tsx";

export default function SenadoresView() {

  const [senadorMap, setSenadorMap ] = useState<SenadoresMapRaw | null>();

  useEffect(() => {
    SenadorService.getRawMap()
      .then(map => setSenadorMap(map))
  }, []);

  if (senadorMap === null) {
    return <SenadoresError/>
  } else {
    return <SenadoresList map={senadorMap}/>
  }
}
