import {useEffect, useState} from "react";
import {Legislatura} from "@senado-cl/global/legislaturas";
import LegislaturaService from "../services/legislaturas.service.ts";
import LegislaturaItem from "../components/LegislaturaItem.tsx";
import {useSearchParams} from "react-router-dom";
import {useToggle} from "react-use";
import Spinner from "../components/Spinner.tsx";
import LegislaturasService from "../services/legislaturas.service.ts";

export default function Legislaturas() {

  const [legislaturas, setLegislaturas] = useState<Legislatura[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [extracting, extractingToggle] = useToggle(false);

  useEffect(() => {
    LegislaturaService.getAll()
      .then(legislaturas => setLegislaturas(legislaturas))
  }, []);

  useEffect(() => {
    if (searchParams.get('tipo') !== 'procesado') {
      setSearchParams({tipo: 'crudo'});
    }
  }, [searchParams]);

  const extract = () => {
    extractingToggle(true);
    LegislaturasService.extract()
      .then(() => {
        setLegislaturas([]);
        LegislaturaService.getAll()
          .then(legislaturas => setLegislaturas(legislaturas))
      })
      .finally(() => extractingToggle(false));
  };

  const tipo = searchParams.get('tipo');

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div>
        <div className="px-4 pt-5 px-6 pb-3">
          <div className="flex pb-2">
            <div className="flex-auto">
              <h3 className="text-base font-semibold leading-7 text-gray-900">Legislaturas</h3>
            </div>
            <div className="flex-none">
              <a onClick={extract} className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-500">
                {extracting ? <Spinner/> : 'Extraer'}
              </a>
            </div>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            Uno de los cuatro periodos de sesiones en que se divide el Periodo Legislativo y que se extiende entre el
            11 de marzo de cada año y el 10 de marzo del año siguiente
          </p>
        </div>

        <nav className="flex space-x-4 px-4 pb-2 pt-4">
          <a
            className={`cursor-pointer ${tipo === 'crudo' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'} rounded-md px-3 py-2 text-sm font-medium`}
            onClick={() => setSearchParams({tipo: 'crudo'})}>
            Crudo
          </a>
          <a
            className={`cursor-pointer ${tipo === 'procesado' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'} rounded-md px-3 py-2 text-sm font-medium`}
            onClick={() => setSearchParams({tipo: 'procesado'})}>
            Procesado
          </a>
        </nav>
      </div>
      <div className="py-0">
        <ul role="list" className="divide-y divide-gray-200">
          {legislaturas.map(l => (
            <li key={l.id} className="flex items-center justify-between gap-x-6 px-6 py-5 group hover:bg-gray-50">
              <LegislaturaItem legislatura={l}/>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
