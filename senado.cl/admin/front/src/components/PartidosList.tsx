import {PartidosMapDtl} from "@senado-cl/global/model";
import PartidosListItem from "./PartidosListItem.tsx";
import PartidosListItemLoading from "./PartidosListItemLoading.tsx";

interface Props {
  map?: PartidosMapDtl
}

export default function PartidosList({map}: Props) {
  const mapKeys = map ? Object.keys(map) : undefined;

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div>
        <div className="pt-5 px-6 pb-3">
          <h3 className="pb-2 text-base font-semibold leading-7 text-gray-900">
            Listado de Partidos {mapKeys ? `(${mapKeys.length})` : ''}
          </h3>
          <p className="mt-1 text-sm leading-6 text-gray-500">
            Son asociaciones autónomas y voluntarias organizadas democráticamente, con personalidad jurídica. Están
            integrados por personas que comparten unos mismos principios ideológicos y políticos.
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Su finalidad es contribuir al funcionamiento del sistema democrático y ejercer influencia en la conducción
            del Estado, para alcanzar el bien común y servir al interés nacional.
          </p>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {mapKeys ? mapKeys.map(bolId => (
            <PartidosListItem key={bolId} data={map![bolId]}/>
          )) : [1, 2, 3, 4, 5].map(index => (
            <PartidosListItemLoading key={index}/>
          ))}
        </ul>
      </div>
    </div>
  )
    ;
}
