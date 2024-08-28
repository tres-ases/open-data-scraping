import {useEffect, useState} from "react";
import SenadoresService from "../services/senadores.service";
import {PeriodoSenador} from "@senado-cl/global/senadores";
import {useNavigate, useSearchParams} from "react-router-dom";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel
} from "@headlessui/react";
import {ChevronDownIcon} from "@heroicons/react/24/outline";

const sortOptions: { [key: string]: { name: string, fn: (a: PeriodoSenador, b: PeriodoSenador) => number } } = {
  alfabetico: {
    name: 'Alfabético (A-Z)',
    fn: (a, b) => a.nombre.localeCompare(b.nombre)
  },
  alfabetico_inv: {
    name: 'Alfabético (Z-A)',
    fn: (a, b) => b.nombre.localeCompare(a.nombre)
  },
  periodos_mas: {
    name: 'Más períodos',
    fn: (a, b) => b.periodos.length - a.periodos.length
  },
  periodos_menos: {
    name: 'Menos períodos',
    fn: (a, b) => a.periodos.length - b.periodos.length
  },
};

export default function Senadores() {

  const [senadores, setSenadores] = useState<PeriodoSenador[]>();
  const [anos, setAnos] = useState<string[]>([]);
  const navigate = useNavigate();
  let [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    SenadoresService.getAll()
      .then(senadores => setSenadores(senadores));
  }, [])

  useEffect(() => {
    if (senadores) {
      let anoMax = new Date().getFullYear();
      let anoMin = anoMax;
      for (const s of senadores) {
        for (const p of s.periodos) {
          if (p.rango.inicio < anoMin) anoMin = p.rango.inicio;
        }
      }
      setAnos(
        Array.from({length: anoMax - anoMin + 1}, (_, i) => `${anoMax - i}`)
      );
    } else {
      setAnos([]);
    }
  }, [senadores]);

  const toDetails = (id: number) => {
    navigate(`/senadores/${id}`);
  }

  const sortIndex = searchParams.get('ordenar') ?? 'alfabetico';
  let selected = searchParams.getAll('anos');
  if (selected.length === 0) selected = [`${new Date().getFullYear()}`]
  const senadoresFiltrados = senadores ? senadores
    .filter(
      s => s.periodos.some(
        p => {
          for (const ano of selected) {
            if (p.rango.inicio <= +ano && +ano <= p.rango.fin) return true;
          }
          return false;
        }
      )
    ).sort(sortOptions[sortIndex] ? sortOptions[sortIndex].fn : sortOptions.alfabetico.fn) : [];

  return (
    <>
      <div className="md:flex md:items-center md:justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">Senadores</h2>
        {senadores && (
          <span className="font-extralight text-sm text-indigo-600">
            Mostrando {senadoresFiltrados.length} registros de un total de {senadores.length}
          </span>
        )}
      </div>
      <section aria-labelledby="filter-heading" className="border-t border-gray-200 pt-6">
        <h2 id="filter-heading" className="sr-only">
          Product filters
        </h2>

        <div className="flex items-center justify-between">
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <MenuButton
                className="group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                Ordenar
                <ChevronDownIcon
                  aria-hidden="true"
                  className="-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                />
              </MenuButton>
            </div>

            <MenuItems
              transition
              className="absolute left-0 z-10 mt-2 w-40 origin-top-left rounded-md bg-white shadow-2xl ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
            >
              <div className="py-1">
                {Object.keys(sortOptions).map((option) => (
                  <MenuItem key={option}>
                    <a onClick={() => setSearchParams(prev => ({...prev, ordenar: option}))}
                       className={`block px-4 py-2 text-sm font-medium data-[focus]:bg-gray-100 cursor-pointer ${option === sortIndex ? 'text-indigo-800 font-extrabold' : 'text-gray-900'}`}>
                      {sortOptions[option].name}
                    </a>
                  </MenuItem>
                ))}
              </div>
            </MenuItems>
          </Menu>

          <button
            type="button"
            onClick={() => {
            }}
            className="inline-block text-sm font-medium text-gray-700 hover:text-gray-900 sm:hidden"
          >
            Filters
          </button>

          <PopoverGroup className="hidden sm:flex sm:items-baseline sm:space-x-8">
            <Popover id="periodo" className="relative inline-block text-left">
              <div>
                <PopoverButton
                  className="group inline-flex items-center justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                  <span>Periodo</span>
                  <span
                    className="ml-1.5 rounded bg-gray-200 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-gray-700">
                    {selected.length}
                  </span>
                  <ChevronDownIcon
                    aria-hidden="true"
                    className="-mr-1 ml-1 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500"
                  />
                </PopoverButton>
              </div>

              <PopoverPanel
                transition
                className="absolute right-0 z-10 mt-2 origin-top-right rounded-md bg-white p-4 shadow-2xl ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
              >
                <form className="space-y-4">
                  {anos?.map(periodo => (
                    <div key={periodo} className="flex items-center">
                      <input
                        defaultChecked={selected.includes(periodo)}
                        id={`filter-periodo-${periodo}`}
                        name="periodo"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        onClick={() => {
                          let anos;
                          if (selected.includes(periodo)) anos = selected.filter(s => s !== periodo);
                          else {
                            anos = [...selected, periodo];
                            anos = anos.sort((a, b) => a.localeCompare(b))
                          }
                          setSearchParams(prev => ({...prev, anos}))
                        }}
                      />
                      <label
                        htmlFor={`filter-periodo-${periodo}`}
                        className="ml-3 whitespace-nowrap pr-6 text-sm font-medium text-gray-900"
                      >
                        {periodo}
                      </label>
                    </div>
                  ))}
                </form>
              </PopoverPanel>
            </Popover>
          </PopoverGroup>
        </div>
      </section>
      <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-4 md:gap-y-0 lg:gap-x-8">
        {senadoresFiltrados
          .map(s => (
            <div key={s.id} className="group relative" onClick={() => toDetails(s.id)}>
              <div
                className="h-56 w-full overflow-hidden rounded-md bg-gray-200 group-hover:opacity-75 lg:h-72 xl:h-80">
                <img
                  alt={s.nombre}
                  src={`/Senadores/Detalle/Foto/parlId=${s.id}/1.jpeg`}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <h3 className="mt-4 text-sm text-gray-700">
                <a href={`/senadores/${s.id}`}>
                  <span className="absolute inset-0"/>
                  {s.nombre}
                </a>
              </h3>
              <p
                className="mt-1 text-sm text-indigo-600 font-light">{s.periodos.length} período{s.periodos.length > 1 ? 's' : ''}</p>
              <p
                className="mt-1 text-sm font-medium text-gray-700">{s.periodos.map((p: any) => `${p.rango.inicio}-${p.rango.fin}`).join(' | ')}</p>
            </div>
          ))}
      </div>
    </>
  )
    ;
}
