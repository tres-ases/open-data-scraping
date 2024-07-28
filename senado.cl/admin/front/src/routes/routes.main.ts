import Inicio from "../views/main/Inicio.tsx";
import Senadores from "../views/main/Senadores.tsx";

export const mainRoutes = {
  inicio: {
    nombre: 'Inicio',
    path: '/inicio',
    element: Inicio
  },
  senadores: {
    nombre: 'Senadores',
    path: '/senadores',
    element: Senadores
  }
};
