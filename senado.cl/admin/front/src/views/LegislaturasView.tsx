import {useEffect, useState} from "react";
import {LegislaturaDtl, LegislaturaRaw} from "@senado-cl/global/legislaturas";
import LegislaturaService from "../services/legislaturas.service.ts";
import LegislaturasService from "../services/legislaturas.service.ts";
import {useSearchParams} from "react-router-dom";
import {useToggle} from "react-use";
import Spinner from "../components/Spinner.tsx";
import {Button, Tab, TabGroup, TabList, TabPanel, TabPanels} from "@headlessui/react";
import LegislaturaRawList from "../components/LegislaturaRawList.tsx";
import LegislaturaDtlList from "../components/LegislaturaDtlList.tsx";
import clsx from "clsx";

export default function LegislaturasView() {

  const [rawData, setRawData] = useState<LegislaturaRaw[]>();
  const [distilledIds, setDistilledIds] = useState<number[]>([]);
  const [dtlData, setDtlData] = useState<LegislaturaDtl[]>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [extracting, extractingToggle] = useToggle(false);

  useEffect(() => {
    LegislaturaService.getRawList()
      .then(data => setRawData(data))
      .catch(() => setRawData([]));
    LegislaturaService.getDtlList()
      .then(data => {
        setDtlData(Object.values(data));
        setDistilledIds(Object.keys(data).map(k => +k))
      })
      .catch(() => setDtlData([]));
  }, []);

  useEffect(() => {
    if (searchParams.get('tipo') !== 'procesado') {
      setSearchParams({tipo: 'crudo'});
    }
  }, [searchParams]);

  useEffect(() => {
    if (extracting) {
      setRawData(undefined);
      setDtlData(undefined);
    }
  }, [extracting]);

  const extractDtl = () => {
    extractingToggle(true);
    LegislaturasService.scrape()
      .then(() => {
        LegislaturaService.getDtlList()
          .then(data => {
            setDtlData(Object.values(data));
            setDistilledIds(Object.keys(data).map(k => +k));
          })
          .finally(() => extractingToggle(false))
      })
      .catch(() => extractingToggle(false));
  };

  const extract = () => {
    extractingToggle(true);
    LegislaturasService.scrape()
      .then(() => {
        LegislaturaService.getRawList()
          .then(data => setRawData(data))
          .finally(() => extractingToggle(false))
        LegislaturaService.getDtlList()
          .then(data => {
            setDtlData(Object.values(data));
            setDistilledIds(Object.keys(data).map(k => +k));
          })
          .finally(() => extractingToggle(false))
      })
      .catch(() => extractingToggle(false));
  };

  const tipo = searchParams.get('tipo');

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
        <TabGroup defaultIndex={tipo === 'procesado' ? 1 : 0}
                  onChange={i => setSearchParams({tipo: i === 1 ? 'procesado' : 'crudo'})}>
          <TabList className="flex space-x-4 my-6 mx-4">
            <Tab
              className="data-[selected]:bg-indigo-100 data-[selected]:text-indigo-700 data-[selected]:outline-indigo-300 outline outline-1 outline-gray-200 bg-gray-50 text-gray-400 rounded-md px-3 py-2 text-sm font-medium">
              {({selected}) => (
                <>
                  Crudo
                  {rawData && (
                    <span className={clsx(
                      selected ? 'bg-gray-100 text-gray-900' : 'bg-indigo-50 text-indigo-400',
                      'ml-3 hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block'
                    )}>
                      {rawData.length}
                    </span>
                  )}
                </>
              )}
            </Tab>
            <Tab
              className="data-[selected]:bg-indigo-100 data-[selected]:text-indigo-700 data-[selected]:outline-indigo-300 outline outline-1 outline-gray-200 bg-gray-50 text-gray-400 rounded-md px-3 py-2 text-sm font-medium">
              {({selected}) => (
                <>
                  Destilado
                  {dtlData && (
                    <span className={clsx(
                      selected ? 'bg-gray-100 text-gray-900' : 'bg-indigo-50 text-indigo-400',
                      'ml-3 hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block'
                    )}>
                      {dtlData.length}
                    </span>
                  )}
                </>
              )}
            </Tab>
          </TabList>
          <TabPanels className="p-0 m-0 bla">
            <TabPanel className="p-0 m-0">
              <LegislaturaRawList data={rawData} distilledIds={distilledIds} distillationEnd={() => extractDtl()}/>
            </TabPanel>
            <TabPanel>
              <LegislaturaDtlList data={dtlData}/>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
      <div className="py-0">
      </div>
    </div>
  );
}
