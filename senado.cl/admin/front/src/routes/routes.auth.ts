import Login from "../views/auth/Login.tsx";
import RecuperarContrasena from "../views/auth/RecuperarContrasena.tsx";
import NewPasswordRequired from "../views/auth/NewPasswordRequired.tsx";

export const authRoutes = {
  login: {
    nombre: 'Inicio Sesión',
    path: '/inicio-sesion',
    element: Login
  },
  newPasswordRq: {
    nombre: 'Se requiere nueva contraseña',
    path: '/nueva-contraseña-requerida',
    element: NewPasswordRequired
  },
  recuperar: {
    nombre: 'Recuperar Contraseña',
    path: '/recuperar-contrasena',
    element: RecuperarContrasena
  }
};
