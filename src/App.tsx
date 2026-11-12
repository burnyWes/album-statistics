import { useState } from 'react'
import { AlbumsPage } from './albums/ui/AlbumsPage'
import { RecordIcon } from './albums/ui/RecordIcon'
import type { AppearanceClient } from './shared/appearance/appearanceClient'
import { useAppearance } from './shared/appearance/useAppearance'
import { AppUpdateOffer } from './shared/appUpdate/AppUpdateOffer'
import type { AppUpdateClient } from './shared/appUpdate/appUpdateClient'
import { useAppUpdate } from './shared/appUpdate/useAppUpdate'
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

type AppProps = {
  appearanceClient: AppearanceClient
  installOfferClient: InstallOfferClient
  appUpdateClient: AppUpdateClient
}

export function App({
  appearanceClient,
  installOfferClient,
  appUpdateClient,
}: AppProps) {
  const { spokenText, announce } = useAnnouncer()
  const [activeArea, setActiveArea] = useState<AreaId>('albums')
  const [settingsHeadingFocusRequest, setSettingsHeadingFocusRequest] =
    useState(0)
  const appearance = useAppearance(appearanceClient)
  const installOffer = useInstallOffer(installOfferClient)
  const installUpdate = useAppUpdate(appUpdateClient, announce)

  async function installApp() {
    const outcome = await installOffer.install()
    announce(installOutcomeAnnouncement(outcome))
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
    ...installEntries,
  ]

  const navigation = (
    <NavigationBar
      areas={AREAS}
      activeArea={activeArea}
      onSelectArea={setActiveArea}
    />
  )

  return (
    <>
      {activeArea === 'albums' && <AlbumsPage navigation={navigation} />}
      {activeArea === 'settings' && (
        <SettingsPage
          navigation={navigation}
          entries={settingsEntries}
          headingFocusRequest={settingsHeadingFocusRequest}
        />
      )}
      {installUpdate !== null && (
        <AppUpdateOffer installUpdate={installUpdate} />
      )}
      <Announcer text={spokenText} />
    </>
  )
}
