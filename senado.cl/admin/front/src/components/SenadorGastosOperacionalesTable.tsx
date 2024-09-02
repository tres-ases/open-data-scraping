import {GastosOperacionales} from "@senado-cl/global/gastos-operacionales";
import {NumericFormat} from 'react-number-format';

interface Props {
  data: GastosOperacionales[]
}

function SenadorGastosOperacionalesTable({data}: Props) {
  return (
    <>
      <div className="mt-8 flow-root overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
          <table className="w-full text-left">
            <thead className="bg-white">
            <tr>
              <th scope="col" className="relative isolate py-3.5 pr-3 text-left text-sm font-semibold text-gray-900">
                Concepto
                <div className="absolute inset-y-0 right-full -z-10 w-screen border-b border-b-gray-200"/>
                <div className="absolute inset-y-0 left-0 -z-10 w-screen border-b border-b-gray-200"/>
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-center text-sm font-semibold text-gray-900 sm:table-cell"
              >
                Monto
              </th>
            </tr>
            </thead>
            <tbody>
            {data
              .filter(gasto => gasto.monto > 0)
              .map((gasto, i) => (
                <tr key={i}>
                  <td className="relative py-4 pr-3 text-sm font-medium text-gray-900">
                    <p className="capitalize">{gasto.concepto.toLowerCase()}</p>
                    <div className="absolute bottom-0 right-full h-px w-screen bg-gray-100"/>
                    <div className="absolute bottom-0 left-0 h-px w-screen bg-gray-100"/>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 text-right">
                    <NumericFormat value={gasto.monto} displayType="text" thousandSeparator="." decimalSeparator=","
                                   prefix="$ "/>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
            <tr>
              <th scope="row" className="pl-8 pr-3 pt-4 text-left text-sm font-semibold text-indigo-600">
                TOTAL
              </th>
              <td className="px-3 py-4 text-right text-sm font-bold text-indigo-600">
                <NumericFormat displayType="text" thousandSeparator="." decimalSeparator="," prefix="$ "
                               value={data.reduce(
                                 (acc, curr) => acc + curr.monto
                                 , 0)}/>
              </td>
            </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
}

export default SenadorGastosOperacionalesTable;
