import {Navigate, Route, Routes,} from "react-router-dom";
import MainLayout from "./layouts/MainLayout.tsx";
import {mainRoutes} from "./routes/routes.main.ts";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout/>}>
        {Object.values(mainRoutes).map(({path, element}) =>
          <Route key={path} path={path} element={element()}/>
        )}
        <Route path="*" element={<Navigate to={mainRoutes.inicio.path} replace={true}/>}/>
      </Route>
    </Routes>
  )
}

export default App
