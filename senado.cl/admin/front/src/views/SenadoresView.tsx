import {useEffect, useState} from "react";
import SenadorService from "../services/senadores.service.ts";
import {SenadorMapRaw} from "@senado-cl/global/model";
import SenadoresLoading from "../components/SenadoresLoading.tsx";
import SenadoresError from "../components/SenadoresError.tsx";
import SenadoresList from "../components/SenadoresList.tsx";

export default function SenadoresView() {

  const [senadorMap, setSenadorMap ] = useState<SenadorMapRaw | null>();

  useEffect(() => {
    SenadorService.getRawMap()
      .then(map => setSenadorMap(map))
  }, []);

  if(senadorMap === undefined) {
    return <SenadoresLoading/>
  } else if (senadorMap === null) {
    return <SenadoresError/>
  } else {
    return <SenadoresList map={senadorMap}/>
  }
}
