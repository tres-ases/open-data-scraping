import {ChevronRightIcon} from "@heroicons/react/24/outline";

export default function SesionDetalleLoading() {
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex mb-3">
          <ol role="list" className="flex items-center space-x-2">
            <li>
              <div className="flex items-center">
                <div className="h-2 w-7 bg-slate-200 rounded"/>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-gray-400"/>
                <div className="ml-4 h-2 w-7 bg-slate-200 rounded"/>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <ChevronRightIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-gray-400"/>
                <div className="ml-4 h-2 w-7 bg-slate-200 rounded"/>
              </div>
            </li>
          </ol>
        </nav>
        <div className="flex flex-wrap mb-3">
          <h3 className="flex-auto">
            <div className="h-4 w-3/12 bg-slate-200 rounded"/>
          </h3>
          <div className="flex-none">
            <div className="h-3 w-10 bg-slate-200 rounded"/>
          </div>
        </div>

        <div className="flex justify-start">
          <div className="h-2 w-2/12 bg-slate-200 rounded mr-2"/>
          <div className="h-2 w-1/12 bg-slate-200 rounded mr-2"/>
          <div className="h-2 w-1/12 bg-slate-200 rounded"/>
        </div>
      </div>
      <div className="border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt>
              <div className="h-4 w-5/12 bg-slate-200 rounded"/>
            </dt>
            <dd className="mt-1 flex text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
              <div className="flex-grow">
                  <div className="h-3 w-2/12 bg-slate-200 rounded mb-2"/>
                  <div className="h-2 w-1/12 bg-slate-200 rounded"/>
              </div>
              <div className="ml-4 flex-shrink-0">
                <div className="h-3 w-7 bg-slate-200 rounded"/>
              </div>
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt>
              <div className="h-4 w-5/12 bg-slate-200 rounded"/>
            </dt>
            <dd className="mt-1">
              <div className="h-3 w-3/12 bg-slate-200 rounded mb-2"/>
              <div className="h-3 w-4/12 bg-slate-200 rounded mb-2"/>
              <div className="h-3 w-4/12 bg-slate-200 rounded"/>
            </dd>
          </div>
          <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt>
              <div className="h-4 w-5/12 bg-slate-200 rounded"/>
            </dt>
            <dd className="mt-1">
              <div className="h-3 w-4/12 bg-slate-200 rounded mb-2"/>
              <div className="h-3 w-4/12 bg-slate-200 rounded"/>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
