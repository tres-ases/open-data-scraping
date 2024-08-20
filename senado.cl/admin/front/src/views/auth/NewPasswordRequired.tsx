import {Button, Field, Fieldset, Input, Label, Legend} from '@headlessui/react'
import {confirmSignIn} from 'aws-amplify/auth';
import {useAuthenticator} from "@aws-amplify/ui-react";
import {yupResolver} from '@hookform/resolvers/yup';
import {useForm} from 'react-hook-form';
import * as yup from 'yup';
import Spinner from "../../components/Spinner.tsx";
import {useState} from "react";

const schema = yup.object({
  newPassword: yup.string()
    .required('Requerido'),
  newPassword2: yup.string()
    .required('Requerido')
    .oneOf([yup.ref("newPassword")], "Passwords must match"),
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
  //const navigate = useNavigate();
  const {} = useAuthenticator();

  const onSubmit = async ({newPassword}: FormData) => {
    setLoading(true);
    const {isSignedIn, nextStep} = await confirmSignIn({challengeResponse: newPassword});
    setLoading(false);
    console.log({isSignedIn, nextStep});
    //if(isSignedIn) {
    //  navigate({
    //    pathname: mainRoutes.inicio.path,
    //  }, {replace: true});
    //}
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Fieldset className="space-y-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm mb-10">
          <Legend className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Cambio de Credenciales
          </Legend>
        </div>

        <Field>
          <Label className="block text-sm font-medium leading-6 text-gray-900">Nueva Contraseña</Label>
          <div className="mt-2">
            <Input id="new-password" type="password" required autoComplete="new-password"
                   className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                   {...register("newPassword")}
                   disabled={loading}/>
            {errors.newPassword && <span>{errors.newPassword.message}</span>}
          </div>
        </Field>

        <Field>
          <Label className="block text-sm font-medium leading-6 text-gray-900">Repetir Nueva Contraseña</Label>
          <div className="mt-2">
            <Input id="new-password2" type="password" required autoComplete="new-password"
                   className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                   {...register("newPassword2")}
                   disabled={loading}/>
            {errors.newPassword2 && <span>{errors.newPassword2.message}</span>}
          </div>
        </Field>
        <Button type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          {loading ? <Spinner/> : 'Enviar'}
        </Button>
      </Fieldset>
    </form>
  );
}

export default Login;
