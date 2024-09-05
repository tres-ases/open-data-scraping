import {useParams} from "react-router-dom";

export default function Sesion() {
  let params = useParams();
  let { sesId } = params;

  return <h1>Sesion {sesId}</h1>
}
