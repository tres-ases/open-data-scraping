import {useContext, useEffect, useState} from "react";
import {LegislaturaMapDtl, LegislaturaRaw} from "@senado-cl/global/legislaturas";
import LegislaturaService from "../services/legislaturas.service.ts";
import Spinner from "../components/Spinner.tsx";
import {Button} from "@headlessui/react";
import LegislaturaList from "../components/LegislaturaList.tsx";
import {LegislaturasViewContext} from "../context/LegislaturasViewContext.tsx";
import clsx from "clsx";

interface Data {
  raw?: LegislaturaRaw[]
  dtl?: LegislaturaMapDtl
}

export default function LegislaturasView() {
  const [data, setData] = useState<Data>();

  const {ids} = useContext(LegislaturasViewContext);

  useEffect(() => {
    console.log(ids);
    if(ids.size === 0) extract();
  }, [ids.size]);

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

  const extracting = ids.size > 0 || (data?.raw === undefined && data?.dtl === undefined);

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
                      className={clsx(
                        'transition ease-in-out duration-300 ring-1 ring-inset ring-gray-250 hover:bg-gray-50 text-gray-800 hover:text-gray-900 hover:ring-gray-300',
                        'relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50 focus:z-10'
                      )}>
                {extracting ? <Spinner/> : 'Extraer Listado'}
              </Button>
            </div>
          </div>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            Uno de los cuatro periodos de sesiones en que se divide el Periodo Legislativo y que se extiende entre el
            11 de marzo de cada año y el 10 de marzo del año siguiente
          </p>
        </div>
        <LegislaturaList rawList={data?.raw} dtlMap={data?.dtl}/>
      </div>
      <div className="py-0">
      </div>
    </div>
  );
}
