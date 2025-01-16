import { useParams } from 'react-router-dom';

export function ProyectoDetail() {
  const { boletin } = useParams();
  return <div>Detalle del proyecto: {boletin}</div>;
} 