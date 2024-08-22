import Inicio from "../views/Inicio.tsx";
import Senadores from "../views/Senadores.tsx";

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
