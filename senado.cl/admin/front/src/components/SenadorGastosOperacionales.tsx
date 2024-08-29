import {Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Label} from "@headlessui/react";
import {CheckIcon, ChevronUpDownIcon} from "@heroicons/react/20/solid";
import {useSearchParams} from "react-router-dom";
import {useEffect, useState} from "react";
import SenadoresService, {AnoMeses} from "../services/senadores.service.ts";

const mesNombre = [null, 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

interface Props {
  id: string
}

function SenadorGastosOperacionales({id}: Props) {

  let [searchParams, setSearchParams] = useSearchParams();
  const [anoMesesList, setAnoMesesList] = useState<AnoMeses[]>([]);

  useEffect(() => {
    id && SenadoresService.getGastosOperacionalesAnoMes(id)
      .then(anoMeses => setAnoMesesList(anoMeses));
  }, [id]);

  useEffect(() => {
    if (anoMesesList.length > 0) {
      const maxAnoMes = anoMesesList.reduce((prev, curr) => {
        return (curr.ano > prev.ano) ? curr : prev;
      });
      const maxMes = Math.max(...maxAnoMes.meses);
      setSearchParams(params => {
        params.set('gastosAno', maxAnoMes.ano.toString());
        params.set('gastosMes', maxMes.toString());
        return params;
      });
    }
  }, [anoMesesList]);

  useEffect(() => {
    const gastosAno = +(searchParams.get("gastosAno") ?? '0');
    const gastosMes = +(searchParams.get("gastosMes") ?? '0');
    if (gastosAno + gastosMes > 0) {

    }
  }, [searchParams.get("gastosAno"), searchParams.get("gastosMes")]);

  const changeAno = (ano: string) => {
    const selectedAnoMeses = anoMesesList.filter(am => am.ano === +ano)[0];
    setSearchParams(params => {
      params.set('gastosAno', ano);
      params.set('gastosMes', Math.max(...selectedAnoMeses.meses).toString());
      return params;
    });
  };

  const changeMes = (mes: string) => {
    setSearchParams(params => {
      params.set('gastosMes', mes.toString());
      return params;
    });
  };

  const gastosAno = +(searchParams.get("gastosAno") ?? '0');
  const gastosMes = +(searchParams.get("gastosMes") ?? '0');
  const selectedAnoMeses = anoMesesList.filter(am => am.ano === gastosAno)[0];
  const meses = selectedAnoMeses ? selectedAnoMeses.meses : [];
  console.log('gastosAno', gastosAno, 'gastosMes', gastosMes)

  return (
    <div
      className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8">
      <Combobox
        as="div"
        value={searchParams.get("gastosAno")}
        onChange={ano => ano && changeAno(ano)}>
        <Label className="block text-sm font-medium leading-6 text-gray-900">Año</Label>
        <div className="relative mt-2">
          <ComboboxInput
            className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            onChange={(event) => console.log(event)}
            displayValue={ano => `${ano}`}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true"/>
          </ComboboxButton>

          {anoMesesList && (
            <ComboboxOptions
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {anoMesesList
                .sort((a, b) => b.ano - a.ano)
                .map((anoMeses) => (
                  <ComboboxOption
                    key={anoMeses.ano}
                    value={anoMeses.ano}
                    className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
                  >
                    <div className="flex">
                      <span className="truncate group-data-[selected]:font-semibold">{anoMeses.ano}</span>
                      <span className="ml-2 truncate text-gray-500 group-data-[focus]:text-indigo-200">
                    {anoMeses.meses.length} registros
                  </span>
                    </div>

                    <span
                      className="absolute inset-y-0 right-0 hidden items-center pr-4 text-indigo-600 group-data-[selected]:flex group-data-[focus]:text-white">
                  <CheckIcon className="h-5 w-5" aria-hidden="true"/>
                </span>
                  </ComboboxOption>
                ))}
            </ComboboxOptions>
          )}
        </div>
      </Combobox>
      <Combobox
        as="div"
        value={mesNombre[gastosMes]}
        onChange={mes => mes && changeMes(mes)}>
        <Label className="block text-sm font-medium leading-6 text-gray-900">Mes</Label>
        <div className="relative mt-2">
          <ComboboxInput
            className="w-full rounded-md border-0 bg-white py-1.5 pl-3 pr-12 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            onChange={(event) => console.log(event)}
            displayValue={mes => `${mes}`}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true"/>
          </ComboboxButton>

          <ComboboxOptions
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {meses
              .map(mes => (
                <ComboboxOption
                  key={mes}
                  value={mes}
                  className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
                >
                  <div className="flex">
                    <span className="truncate group-data-[selected]:font-semibold">{mesNombre[mes]}</span>
                  </div>

                  <span
                    className="absolute inset-y-0 right-0 hidden items-center pr-4 text-indigo-600 group-data-[selected]:flex group-data-[focus]:text-white">
                  <CheckIcon className="h-5 w-5" aria-hidden="true"/>
                </span>
                </ComboboxOption>
              ))}
          </ComboboxOptions>
        </div>
      </Combobox>
    </div>
  );
}

export default SenadorGastosOperacionales;
