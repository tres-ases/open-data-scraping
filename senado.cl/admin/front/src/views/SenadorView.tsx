import {useParams} from "react-router-dom";
import {useEffect, useState} from "react";
import SenadorService from "../services/senadores.service.ts";
import {SenadorRaw} from "@senado-cl/global/model";
import SenadorLoading from "../components/SenadorLoading.tsx";
import SenadorError from "../components/SenadorError.tsx";
import SenadorDetalles from "../components/SenadorDetalles.tsx";

export default function SenadorView() {
  const { senSlug } = useParams();
  const [senador, setSenador] = useState<SenadorRaw | null>()

  useEffect(() => {
    setSenador(undefined);
    if(senSlug) {
      SenadorService.getRaw(senSlug)
        .then(senador => setSenador(senador))
        .catch(err => {
          console.error(err);
          setSenador(null);
        });
    }
  }, [senSlug]);

  if(senador === undefined) {
    return <SenadorLoading/>
  } else if (senador === null) {
    return <SenadorError/>
  } else {
    return <SenadorDetalles senador={senador}/>
  }
}
