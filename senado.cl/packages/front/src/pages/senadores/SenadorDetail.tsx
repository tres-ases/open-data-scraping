import { useParams } from 'react-router-dom';

export function SenadorDetail() {
  const { slug } = useParams();
  return <div>Detalle del senador: {slug}</div>;
} 