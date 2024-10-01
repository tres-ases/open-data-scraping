import {Link, useParams} from "react-router-dom";
import Spinner from "../components/Spinner.tsx";
import {useToggle} from "react-use";
import {useEffect, useState} from "react";
import SesionList from "../components/SesionList.tsx";
import clsx from "clsx";
import {Button} from "@headlessui/react";
import {ChevronRightIcon} from "@heroicons/react/24/outline";
import LegislaturaService from "../services/legislaturas.service.ts";
import {LegislaturaDtl} from "@senado-cl/global/legislaturas";
import SesionesService from "../services/sesiones.service.ts";

export default function LegislaturaView() {
  let params = useParams();
  let {legId} = params;
  const [extracting, extractingToggle] = useToggle(false);
  const [data, setData] = useState<LegislaturaDtl>();

  useEffect(() => {
    getData();
  }, [legId]);

  const getData = () => {
    legId && LegislaturaService.getDtl(legId)
      .then(data => {
        setData(data);
      })
      .catch(err => console.error(err));
  };

  const extract = () => {
    if(legId) {
      extractingToggle(true);
      SesionesService.extract(legId)
        .then(() => {
          setData(undefined);
          getData();
        })
        .finally(() => extractingToggle(false));
    }
  };

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div className="flex pt-4 mx-4">
        <div className="flex-auto">
          <nav aria-label="Breadcrumb" className="flex">
            <ol role="list" className="flex items-center space-x-2">
              <li>
                <div className="flex items-center">
                  <Link to="/legislaturas" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    Legislaturas
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRightIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-gray-400"/>
                  <p className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Legislatura
                  </p>
                </div>
              </li>
            </ol>
          </nav>
          <div className="pt-2 pb-3">
            <div className="pb-2">
              <h3 className="text-base font-semibold leading-7 text-gray-900">
                Legislatura {data && <>N° {data.numero}</>}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                id: {legId} {data && data.sesiones.length > 0 ? `- ${data.sesiones.length} sesiones` : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="flex-none">
          <Button type="button" disabled={extracting} onClick={extract}
                  className={clsx(
                    'transition ease-in-out duration-300 ring-1 ring-inset ring-gray-250 hover:bg-gray-50 text-gray-800 hover:text-gray-900 hover:ring-gray-300',
                    'relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50 focus:z-10'
                  )}>
            {extracting ? <Spinner/> : 'Procesar'}
          </Button>
        </div>
      </div>
      <div className="py-0">
        <SesionList sesiones={data? data.sesiones : []}/>
      </div>
    </div>
  );
}
