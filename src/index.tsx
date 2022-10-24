import React, { Suspense } from 'react'
import ReactDOM from 'react-dom'
import './assets/css/tailwind.output.css'
import './assets/styles/style.css'
import "@near-wallet-selector/modal-ui/styles.css";
import App from './App'
import { SidebarProvider } from './context/SidebarContext'
import ThemedSuspense from './components/ThemedSuspense'
import { Windmill } from '@windmill/react-ui'
import * as serviceWorker from './serviceWorker'
import { transitions, positions, Provider as AlertProvider } from 'react-alert';
import AlertTemplate from 'react-alert-template-basic';
import { AppWalletProvider } from './context/solana/AppWalletProvider';

// if (process.env.NODE_ENV !== 'production') {
//   const axe = require('react-axe')
//   axe(React, ReactDOM, 1000)
// }

const options = {
  // you can also just use 'bottom center'
  position: positions.BOTTOM_CENTER,
  timeout: 5000,
  offset: '30px',
  // you can also just use 'scale'
  transition: transitions.SCALE
}

ReactDOM.render(
  <SidebarProvider>
    <Suspense fallback={<ThemedSuspense />}>
      <Windmill usePreferences>
        <AlertProvider template={AlertTemplate} {...options}>
          <AppWalletProvider>
            <App />
          </AppWalletProvider>
        </AlertProvider>
      </Windmill>
    </Suspense>
  </SidebarProvider>,
  document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.default()
