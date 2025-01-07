export default function PartidosListItemLoading() {
  return (
    <li className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
      <div className="flex min-w-0 gap-x-4">
        <div className="min-w-0 flex-auto">
          <div className="mb-2">
            <span className="absolute inset-x-0 -top-px bottom-0"/>
            <div className="h-4 w-16 bg-slate-300 rounded"/>
          </div>
          <div className="text-xs font-normal leading-6 text-gray-700">
            <div className="h-2 w-32 bg-slate-300 rounded"/>
          </div>
        </div>
      </div>
    </li>
  );
}
