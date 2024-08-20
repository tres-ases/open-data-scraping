import React from 'react'
import ReactDOM from 'react-dom/client'
import {Amplify} from "aws-amplify"
import {Authenticator} from '@aws-amplify/ui-react';
import './index.css'
import App from "./App.tsx";
import {BrowserRouter} from "react-router-dom";
import '@aws-amplify/ui-react/styles.css';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_GvoNgTrs1",
      userPoolClientId: "4909g1rde7kln7eqbibfsag5ep",
    },
  },
  API: {
    REST: {
      admin: {
        endpoint: "http://localhost:5173/api/",
        region: "us-east-1"
      }
    }
  }
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
