import { useParams } from 'react-router-dom';

export function PartidoDetail() {
  const { id } = useParams();
  return <div>Detalle del partido: {id}</div>;
} 