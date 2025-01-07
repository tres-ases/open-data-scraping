import React from 'react'
import ReactDOM from 'react-dom/client'
import {Amplify} from "aws-amplify"
import {Authenticator} from '@aws-amplify/ui-react';
import {fetchAuthSession} from 'aws-amplify/auth';
import './index.css'
import App from "./App.tsx";
import {BrowserRouter} from "react-router-dom";
import '@aws-amplify/ui-react/styles.css';

Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      },
    },
    API: {
      REST: {
        'admin': {
          endpoint: `${window.location.origin}/api`,
        }
      }
    }
  },
  {
    API: {
      REST: {
        headers: async () => {
          const authToken = (await fetchAuthSession()).tokens?.idToken?.toString();
          return {Authorization: `${authToken!}`};
        },
      },
    },
  })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Authenticator.Provider>
        <Authenticator loginMechanisms={['email']} hideSignUp>
          <App/>
        </Authenticator>
      </Authenticator.Provider>
    </BrowserRouter>
  </React.StrictMode>,
)
