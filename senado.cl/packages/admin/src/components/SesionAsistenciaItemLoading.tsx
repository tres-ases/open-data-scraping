import {ChevronRightIcon} from "@heroicons/react/24/outline";

export default function SesionAsistenciaItemLoading() {

  return (
    <li className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
      <div className="flex min-w-0 gap-x-4">
        <div className="h-12 w-12 flex-none rounded-full bg-slate-300"/>
        <div className="min-w-0 flex-auto">
            <div className="ml-4 h-4 w-28 bg-slate-300 rounded mb-3"/>
            <div className="ml-4 h-3 w-20 bg-slate-200 rounded"/>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-x-4">
        <div className="hidden sm:flex sm:flex-col sm:items-end">
          <div className="ml-4 h-4 w-10 bg-slate-200 rounded"/>
        </div>
        <ChevronRightIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400"/>
      </div>
    </li>
  );
}
