export default function LegislaturaRawItemLoading() {
  return (
    <>
      <div className="animate-pulse min-w-0 m-4">
        <div className="flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-start gap-x-3 ">
              <div className="text-sm font-semibold leading-6 h-3 w-14 bg-slate-300 rounded my-3"/>
            </div>
            <div className="mt-2 flex items-center gap-x-2 text-xs leading-5 text-gray-500 pb-2">
              <div className="h-2 w-7 bg-slate-300 rounded"/>
              {' - '}
              <div className="h-2 w-7 bg-slate-200 rounded"/>
              <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                <circle r={1} cx={1} cy={1}/>
              </svg>
              <div className="h-2 w-4 bg-slate-300 rounded"/>
            </div>
          </div>
          <div className="flex flex-none items-center gap-x-4">
            <div className="h-5 w-16 bg-slate-200 rounded"/>
          </div>
        </div>
      </div>
    </>
  );
}
