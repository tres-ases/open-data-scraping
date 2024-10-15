import {Navigate, Route, Routes,} from "react-router-dom";
import MainLayout from "./layouts/MainLayout.tsx";
import InicioView from "./views/InicioView.tsx";
import SenadoresView from "./views/SenadoresView.tsx";
import SenadorView from "./views/SenadorView.tsx";
import LegislaturasView from "./views/LegislaturasView.tsx";
import LegislaturaView from "./views/LegislaturaView.tsx";
import SesionView from "./views/SesionView.tsx";
import {LegislaturasViewProvider} from "./context/LegislaturasViewContext.tsx";
import ProyectosView from "./views/ProyectosView.tsx";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout/>}>
        <Route path="inicio" element={<InicioView/>} />
        <Route path="legislaturas" element={
          <LegislaturasViewProvider>
            <LegislaturasView/>
          </LegislaturasViewProvider>
        } />
        <Route path="legislatura">
          <Route path=":legId" element={<LegislaturaView/>}/>
        </Route>
        <Route path="sesion">
          <Route path=":sesId" element={<SesionView/>}/>
        </Route>
        <Route path="senadores">
          <Route index element={<SenadoresView/>}/>
        </Route>
        <Route path="senador">
          <Route path=":senId" element={<SenadorView/>}/>
        </Route>
        <Route path="Proyectos">
          <Route index element={<ProyectosView/>}/>
        </Route>
        <Route path="*" element={<Navigate to="inicio" replace={true}/>}/>
      </Route>
    </Routes>
  )
}

export default App
