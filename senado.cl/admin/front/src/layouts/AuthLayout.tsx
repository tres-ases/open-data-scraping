import {Outlet, useNavigate} from "react-router-dom";
import {useEffect} from "react";
import {mainRoutes} from "../routes/routes.main.ts";
import {useAuthenticator} from "@aws-amplify/ui-react";

export default function AuthLayout() {
  const {user} = useAuthenticator(context => [context.user]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('user', user);
    if(user) navigate(mainRoutes.inicio.path, {replace: true});
  }, [user]);

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Outlet/>
      </div>
    </div>
  );
}
