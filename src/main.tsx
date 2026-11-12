import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import { createLocalStorageAppearanceClient } from './shared/appearance/localStorageAppearanceClient.ts'
import { createServiceWorkerAppUpdateClient } from './shared/appUpdate/serviceWorkerAppUpdateClient.ts'
import { createBrowserInstallOfferClient } from './shared/install/browserInstallOfferClient.ts'
import './index.css'

const appearanceClient = createLocalStorageAppearanceClient()

const installOfferClient = createBrowserInstallOfferClient()

const appUpdateClient = createServiceWorkerAppUpdateClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      appearanceClient={appearanceClient}
      installOfferClient={installOfferClient}
      appUpdateClient={appUpdateClient}
    />
  </StrictMode>,
)
