import {VotacionRaw} from "@senado-cl/global/sesiones";

interface Props {
  votaciones?: VotacionRaw[]
}

export default function SesionVotaciones({votaciones = []}: Props) {
  console.log(votaciones)
  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-6 sm:px-6">
        <div className="flex flex-wrap">
          <h3 className="flex-auto text-base font-semibold leading-7 text-gray-900">Votaciones</h3>
        </div>
      </div>
    </div>
  );
}
