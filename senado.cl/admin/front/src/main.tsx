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
        userPoolId: "us-east-1_UU467OK5k",
        userPoolClientId: "16vs3clkgnak4bcl4cgqmrjf70",
      },
    },
    API: {
      REST: {
        admin: {
          endpoint: "http://localhost:5173/api/",
          region: "us-east-1",
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
