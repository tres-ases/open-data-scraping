import {useParams} from "react-router-dom";
import Spinner from "../components/Spinner.tsx";
import {useToggle} from "react-use";
import {useEffect} from "react";

export default function Legislatura() {
  let params = useParams();
  let { id } = params;
  const [extracting/*, extractingToggle*/] = useToggle(false);

  useEffect(() => {

  }, [id]);

  return (
    <div className="divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow">
      <div>
        <div className="px-4 pt-5 px-6 pb-3">
          <div className="flex pb-2">
            <div className="flex-auto">
              <h3 className="text-base font-semibold leading-7 text-gray-900">Legislatura</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                id: {id}
              </p>
            </div>
            <div className="flex-none">
              <a onClick={() => {}} className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-500">
                {extracting ? <Spinner/> : 'Actualizar'}
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="py-0">

      </div>
    </div>
  );
}
