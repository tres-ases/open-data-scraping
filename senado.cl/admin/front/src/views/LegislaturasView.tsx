import {useContext, useEffect, useState} from "react";
import {LegislaturaMapDtl, LegislaturaRaw} from "@senado-cl/global/legislaturas";
import LegislaturaService from "../services/legislaturas.service.ts";
import Spinner from "../components/Spinner.tsx";
import {Button} from "@headlessui/react";
import LegislaturaList from "../components/LegislaturaList.tsx";
import {LegislaturasViewContext} from "../context/LegislaturasViewContext.tsx";

interface Data {
  raw?: LegislaturaRaw[]
  dtl?: LegislaturaMapDtl
}

export default function LegislaturasView() {
  const [data, setData] = useState<Data>({});

  const {ids} = useContext(LegislaturasViewContext);

  useEffect(() => {
    if(ids.size === 0) extract();
  }, [ids]);

  const extract = () => {
    setData({});
    Promise.all([
      LegislaturaService.getRawList(),
      LegislaturaService.getDtlList()
    ])
      .then(([raw, dtl]) => {
        setData({raw, dtl});
      })
      .catch(error => {
        console.error(error);
        setData({raw: [], dtl: {}})
      });
  }

  const extracting = ids.size > 0 || (data.raw === undefined && data.dtl === undefined);

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div>
        <div className="pt-5 px-6 pb-3">
          <div className="flex pb-2">
            <div className="flex-auto">
              <h3 className="text-base font-semibold leading-7 text-gray-900">Legislaturas</h3>
            </div>
            <div className="flex-none">
              <Button type="button" disabled={extracting} onClick={extract}
                      className="text-sm text-indigo-600 hover:text-indigo-500 inline-flex items-center px-4 py-2 font-semibold leading-6 shadow rounded-md bg-gray-200 hover:bg-gray-100 transition ease-in-out duration-150">
                {extracting ? <Spinner/> : 'Extraer'}
              </Button>
            </div>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            Uno de los cuatro periodos de sesiones en que se divide el Periodo Legislativo y que se extiende entre el
            11 de marzo de cada año y el 10 de marzo del año siguiente
          </p>
        </div>
        <LegislaturaList rawList={data.raw} dtlMap={data.dtl}/>
      </div>
      <div className="py-0">
      </div>
    </div>
  );
}
