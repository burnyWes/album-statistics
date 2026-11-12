import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserCoverImageClient } from './albums/api/browserCoverImageClient.ts'
import { createLocalStorageAlbumsClient } from './albums/api/localStorageAlbumsClient.ts'
import { App } from './App.tsx'
import { createLocalStorageAppearanceClient } from './shared/appearance/localStorageAppearanceClient.ts'
import { createBrowserFileExportClient } from './shared/files/browserFileExportClient.ts'
import { createServiceWorkerAppUpdateClient } from './shared/appUpdate/serviceWorkerAppUpdateClient.ts'
import { createBrowserInstallOfferClient } from './shared/install/browserInstallOfferClient.ts'
import { requestPersistentStorage } from './shared/storage/persistentStorage.ts'
import './index.css'

const appearanceClient = createLocalStorageAppearanceClient()

const installOfferClient = createBrowserInstallOfferClient()

const appUpdateClient = createServiceWorkerAppUpdateClient()

const albumsClient = createLocalStorageAlbumsClient()

const fileExportClient = createBrowserFileExportClient()

const coverImageClient = createBrowserCoverImageClient()

void requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      appearanceClient={appearanceClient}
      installOfferClient={installOfferClient}
      appUpdateClient={appUpdateClient}
      albumsClient={albumsClient}
      fileExportClient={fileExportClient}
      coverImageClient={coverImageClient}
      clock={() => new Date()}
    />
  </StrictMode>,
)
