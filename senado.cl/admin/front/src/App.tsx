import {Navigate, Route, Routes,} from "react-router-dom";
import MainLayout from "./layouts/MainLayout.tsx";
import Inicio from "./views/Inicio.tsx";
import Senadores from "./views/Senadores.tsx";
import Senador from "./views/Senador.tsx";
import Legislaturas from "./views/Legislaturas.tsx";
import Legislatura from "./views/Legislatura.tsx";
import Sesion from "./views/Sesion.tsx";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout/>}>
        <Route path="inicio" element={<Inicio/>} />
        <Route path="legislaturas" element={<Legislaturas/>} />
        <Route path="legislatura">
          <Route path=":legId" element={<Legislatura/>}/>
        </Route>
        <Route path="sesion">
          <Route path=":sesId" element={<Sesion/>}/>
        </Route>
        <Route path="senadores">
          <Route index element={<Senadores/>}/>
          <Route path=":senId" element={<Senador/>}/>
        </Route>
        <Route path="*" element={<Navigate to="inicio" replace={true}/>}/>
      </Route>
    </Routes>
  )
}

export default App
