import {Button, Field, Fieldset, Input, Label, Legend} from '@headlessui/react'
import {signIn} from 'aws-amplify/auth'
import {yupResolver} from '@hookform/resolvers/yup';
import {useForm} from 'react-hook-form';
import * as yup from 'yup';
import {authRoutes} from "../../routes/routes.auth.ts";
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import Spinner from "../../components/Spinner.tsx";

const schema = yup.object({
  email: yup.string()
    .email('Correo electrónico inválido')
    .required('Requerido'),
  password: yup.string()
    .required('Requerido'),
}).required();

function Login() {

  type FormData = yup.InferType<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: {errors},
  } = useForm<FormData>({
    resolver: yupResolver(schema)
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async ({email, password}: FormData) => {
    setLoading(true);
    try {
      const {isSignedIn, nextStep} = await signIn({username: email, password});
      setLoading(false);
      console.log({email, password}, {isSignedIn, nextStep});
      if (!isSignedIn && nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED") {
        console.log(authRoutes.newPasswordRq.path);
        navigate({
          pathname: authRoutes.newPasswordRq.path,
          //search: `?correo=${getValues("email")}`
        }, {replace: false});
      }
    } finally {
      setLoading(false);
    }
  };

  console.log(errors.email)

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Fieldset className="space-y-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm mb-10">
          <Legend className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Iniciar Sesión
          </Legend>
        </div>
        <Field>
          <Label className="block text-sm font-medium leading-6 text-gray-900">Correo electrónico</Label>
          <div className="mt-2">
            <Input id="email" type="email" required autoComplete="email"
                   className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                   {...register("email")}
                   disabled={loading}/>
            {errors.email && <span className="text-rose-400 text-sm">{errors.email.message}</span>}
          </div>
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <Label className="block text-sm font-medium leading-6 text-gray-900">Contraseña</Label>
            <div className="text-sm">
              <a href={authRoutes.recuperar.path} className="font-semibold text-indigo-600 hover:text-indigo-500"
                 tabIndex={-1}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>
          <div className="mt-2">
            <Input id="password" type="password" required autoComplete="current-password"
                   className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                   {...register("password")}
                   disabled={loading}/>
            {errors.password && <span className="text-rose-400 text-sm">{errors.password.message}</span>}
          </div>
        </Field>
        <Button type="submit" disabled={loading}
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          {loading ? <Spinner/> : 'Ingresar'}
        </Button>
      </Fieldset>
    </form>
  );
}

export default Login;
