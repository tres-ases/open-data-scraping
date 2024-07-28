import {BrowserRouter, Route, Routes,} from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout.tsx";
import MainLayout from "./layouts/MainLayout.tsx";
import {mainRoutes} from "./routes/routes.main.ts";
import {authRoutes} from "./routes/routes.auth.ts";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout/>}>
          {Object.values(mainRoutes).map(({path, element}) =>
              <Route key={path} path={path} element={element()}/>
          )}
        </Route>
        <Route element={<AuthLayout/>}>
          {Object.values(authRoutes).map(({path, element}) =>
            <Route key={path} path={path} element={element()}/>
          )}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
