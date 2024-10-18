export default function SenadoresListItemLoading() {

  return (
    <li className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
      <div className="flex min-w-0 gap-x-4">
        <div className="h-12 w-12 flex-none rounded-full bg-slate-200"/>
        <div className="min-w-0 flex-auto">
          <div className="text-sm font-semibold leading-6 text-gray-900">
            <div>
              <span className="absolute inset-x-0 -top-px bottom-0"/>
              <div className="h-2 w-20 bg-slate-300 rounded"/>
            </div>
          </div>
          <div className="mt-1 flex text-xs leading-5 text-gray-400">
            <div className="relative truncate hover:underline">
              <div className="h-2 w-16 bg-slate-300 rounded"/>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
