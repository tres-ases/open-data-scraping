import {useEffect} from "react";
import SenadoresService from "../../services/senadores.service.ts";

export default function Senadores() {

  useEffect(() => {
    SenadoresService.getAll()
      .then(result => console.log(result) );
  })

  return <h1>Senadores</h1>
}
