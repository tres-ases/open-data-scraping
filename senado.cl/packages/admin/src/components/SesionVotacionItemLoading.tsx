export default function SesionVotacionItemLoading() {

  return (
    <li className="group gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
      <div className="flex min-w-0 gap-x-4">
        <div className="min-w-0 flex-auto">
          <div className="ml-4 h-4 w-28 bg-slate-400 rounded mb-3"/>
          <div className="ml-4 h-4 w-20 bg-slate-300 rounded mb-3"/>
          <div className="ml-4 h-4 w-8/12 bg-slate-300 rounded mb-3"/>
        </div>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="relative px-4 pb-2 sm:pt-6">
            <dt>
              <div className="ml-4 h-4 w-20 bg-slate-300 rounded mb-3"/>
            </dt>
            <dd className="flex items-baseline pb-2">
              <p>
                <div className="ml-4 h-4 w-14 bg-slate-400 rounded mb-3"/>
              </p>
            </dd>
          </div>
        ))}
      </dl>
    </li>
  );
}
