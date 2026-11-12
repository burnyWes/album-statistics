import { useState } from 'react'
import type { AlbumsClient } from './albums/api/albumsClient'
import { AlbumsArea } from './albums/ui/AlbumsArea'
import { AlbumsBackupPage } from './albums/ui/AlbumsBackupPage'
import { RecordIcon } from './albums/ui/RecordIcon'
import type { AppearanceClient } from './shared/appearance/appearanceClient'
import { useAppearance } from './shared/appearance/useAppearance'
import { AppUpdateOffer } from './shared/appUpdate/AppUpdateOffer'
import type { AppUpdateClient } from './shared/appUpdate/appUpdateClient'
import { useAppUpdate } from './shared/appUpdate/useAppUpdate'
import type { FileExportClient } from './shared/files/fileExportClient'
import { installOutcomeAnnouncement } from './shared/install/installAnnouncements'
import type { InstallOfferClient } from './shared/install/installOfferClient'
import { useInstallOffer } from './shared/install/useInstallOffer'
import { Announcer } from './shared/ui/Announcer'
import { NavigationBar, type Area } from './shared/ui/NavigationBar'
import { SettingsIcon } from './shared/ui/SettingsIcon'
import { SettingsPage, type SettingsEntry } from './shared/ui/SettingsPage'
import { useAnnouncer } from './shared/ui/useAnnouncer'

const AREAS = [
  { id: 'albums', label: 'Alben', icon: <RecordIcon /> },
  { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon /> },
] as const satisfies readonly Area<string>[]

type AreaId = (typeof AREAS)[number]['id']

type SettingsSubpage =
  { kind: 'overview'; focusedEntry: string | null } | { kind: 'backup' }

const SETTINGS_OVERVIEW: SettingsSubpage = {
  kind: 'overview',
  focusedEntry: null,
}

type AppProps = {
  appearanceClient: AppearanceClient
  installOfferClient: InstallOfferClient
  appUpdateClient: AppUpdateClient
  albumsClient: AlbumsClient
  fileExportClient: FileExportClient
  clock: () => Date
}

export function App({
  appearanceClient,
  installOfferClient,
  appUpdateClient,
  albumsClient,
  fileExportClient,
  clock,
}: AppProps) {
  const { spokenText, announce } = useAnnouncer()
  const [activeArea, setActiveArea] = useState<AreaId>('albums')
  const [settingsPage, setSettingsPage] =
    useState<SettingsSubpage>(SETTINGS_OVERVIEW)
  const [settingsHeadingFocusRequest, setSettingsHeadingFocusRequest] =
    useState(0)
  const appearance = useAppearance(appearanceClient)
  const installOffer = useInstallOffer(installOfferClient)
  const installUpdate = useAppUpdate(appUpdateClient, announce)

  async function installApp() {
    const outcome = await installOffer.install()
    announce(installOutcomeAnnouncement(outcome))
    setSettingsPage(SETTINGS_OVERVIEW)
    setSettingsHeadingFocusRequest((request) => request + 1)
  }

  const installEntries: SettingsEntry[] = installOffer.available
    ? [
        {
          kind: 'action',
          id: 'installApp',
          label: 'App installieren',
          onSelect: () => void installApp(),
        },
      ]
    : []

  const settingsEntries: SettingsEntry[] = [
    {
      kind: 'toggle',
      id: 'invertedColors',
      label: 'Farben invertieren',
      enabled: appearance.invertedColors,
      onToggle: appearance.toggleInvertedColors,
    },
    {
      kind: 'toggle',
      id: 'invertedButtons',
      label: 'Nur Buttons invertieren',
      enabled: appearance.invertedButtons,
      onToggle: appearance.toggleInvertedButtons,
    },
    {
      kind: 'action',
      id: 'albumsBackup',
      label: 'Daten speichern und laden',
      onSelect: () => setSettingsPage({ kind: 'backup' }),
    },
    ...installEntries,
  ]

  function selectArea(area: AreaId) {
    setActiveArea(area)
    setSettingsPage(SETTINGS_OVERVIEW)
  }

  const navigation = (
    <NavigationBar
      areas={AREAS}
      activeArea={activeArea}
      onSelectArea={selectArea}
    />
  )

  return (
    <>
      {activeArea === 'albums' && (
        <AlbumsArea
          albumsClient={albumsClient}
          clock={clock}
          announce={announce}
          navigation={navigation}
        />
      )}
      {activeArea === 'settings' && settingsPage.kind === 'overview' && (
        <SettingsPage
          navigation={navigation}
          entries={settingsEntries}
          headingFocusRequest={settingsHeadingFocusRequest}
          focusedEntry={settingsPage.focusedEntry}
        />
      )}
      {activeArea === 'settings' && settingsPage.kind === 'backup' && (
        <AlbumsBackupPage
          albumsClient={albumsClient}
          clock={clock}
          fileExportClient={fileExportClient}
          announce={announce}
          onBack={() =>
            setSettingsPage({ kind: 'overview', focusedEntry: 'albumsBackup' })
          }
        />
      )}
      {installUpdate !== null && (
        <AppUpdateOffer installUpdate={installUpdate} />
      )}
      <Announcer text={spokenText} />
    </>
  )
}
