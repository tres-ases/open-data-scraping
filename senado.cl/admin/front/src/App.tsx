import {Navigate, Route, Routes,} from "react-router-dom";
import MainLayout from "./layouts/MainLayout.tsx";
import Inicio from "./views/Inicio.tsx";
import Senadores from "./views/Senadores.tsx";
import Senador from "./views/Senador.tsx";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout/>}>
        <Route path="inicio" element={<Inicio/>} />
        <Route path="senadores">
          <Route index element={<Senadores/>}/>
          <Route path=":id" element={<Senador/>}/>
        </Route>
        <Route path="*" element={<Navigate to="inicio" replace={true}/>}/>
      </Route>
    </Routes>
  )
}

export default App
