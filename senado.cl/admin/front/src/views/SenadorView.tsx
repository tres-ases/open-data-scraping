import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import SenadorService from "../services/senadores.service.ts";
import {SenadorRaw} from "@senado-cl/global/model";
import SenadorLoading from "../components/SenadorLoading.tsx";
import SenadorError from "../components/SenadorError.tsx";
import SenadorDetalles from "../components/SenadorDetalles.tsx";

export default function SenadorView() {
  const { senId } = useParams();
  const [senador, setSenador] = useState<SenadorRaw | null>()

  useEffect(() => {
    setSenador(undefined);
    if(senId) {
      SenadorService.getRaw(senId)
        .then(senador => setSenador(senador))
        .catch(() => setSenador(null));
    }
  }, [senId]);

  if(senador === undefined) {
    return <SenadorLoading/>
  } else if (senador === null) {
    return <SenadorError/>
  } else {
    return <SenadorDetalles senador={senador}/>
  }
}
