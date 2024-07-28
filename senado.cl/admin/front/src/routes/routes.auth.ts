import Login from "../views/auth/Login.tsx";
import RecuperarContrasena from "../views/auth/RecuperarContrasena.tsx";

export const authRoutes = {
  login: {
    nombre: 'Inicio Sesión',
    path: '/inicio-sesion',
    element: Login
  },
  recuperar: {
    nombre: 'Recuperar Contraseña',
    path: '/recuperar-contrasena',
    element: RecuperarContrasena
  }
};
