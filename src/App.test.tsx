import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { albumsFileText } from './albums/api/albumsFile'
import { createInMemoryAlbumsClient } from './albums/api/inMemoryAlbumsClient'
import type { Album } from './albums/domain/album'
import { App } from './App'
import type { ColorInversion } from './shared/appearance/appearanceClient'
import { createInMemoryAppearanceClient } from './shared/appearance/inMemoryAppearanceClient'
import { createInMemoryAppUpdateClient } from './shared/appUpdate/inMemoryAppUpdateClient'
import { createInMemoryFileExportClient } from './shared/files/inMemoryFileExportClient'
import type { InstallOutcome } from './shared/install/installOfferClient'
import { createInMemoryInstallOfferClient } from './shared/install/inMemoryInstallOfferClient'
import { accessibilityViolations } from './testSupport/accessibility'

function renderApp({
  colorInversion = {} as Partial<ColorInversion>,
  installOutcome = 'accepted' as InstallOutcome,
  albums = [] as readonly Album[],
} = {}) {
  const appearanceClient = createInMemoryAppearanceClient(colorInversion)
  const installOfferClient = createInMemoryInstallOfferClient(installOutcome)
  const appUpdateClient = createInMemoryAppUpdateClient()
  const albumsClient = createInMemoryAlbumsClient(albums)
  const fileExportClient = createInMemoryFileExportClient()
  const rendered = render(
    <App
      appearanceClient={appearanceClient}
      installOfferClient={installOfferClient}
      appUpdateClient={appUpdateClient}
      albumsClient={albumsClient}
      fileExportClient={fileExportClient}
      clock={() => new Date(2026, 10, 15, 12, 0)}
    />,
  )
  return {
    ...rendered,
    appearanceClient,
    installOfferClient,
    appUpdateClient,
    albumsClient,
    fileExportClient,
  }
}

function installButton() {
  return screen.queryByRole('button', { name: 'App installieren' })
}

function settingsHeading() {
  return screen.getByRole('heading', { level: 1, name: 'Einstellungen' })
}

function invertedColorsCheckbox() {
  return screen.getByRole('checkbox', { name: 'Farben invertieren' })
}

function invertedButtonsCheckbox() {
  return screen.getByRole('checkbox', { name: 'Nur Buttons invertieren' })
}

function areaButton(name: string) {
  return screen.getByRole('button', { name })
}

function backupEntry() {
  return screen.getByRole('button', { name: 'Daten speichern und laden' })
}

async function openBackup() {
  await userEvent.click(areaButton('Einstellungen'))
  await userEvent.click(backupEntry())
}

describe('App', () => {
  it('starts on the albums page', () => {
    renderApp()

    expect(
      screen.getByRole('heading', { level: 1, name: 'Alben' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Noch keine Alben.')).toBeInTheDocument()
  })

  it('opens adding an album from the albums page', async () => {
    renderApp()

    await userEvent.click(
      screen.getByRole('button', { name: 'Album hinzufügen' }),
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Album hinzufügen' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Albumname' })).toHaveFocus()
  })

  it('drops the undo offer when switching the area', async () => {
    renderApp({
      albums: [
        {
          id: 'kind-of-blue',
          title: 'Kind of Blue',
          artist: 'Miles Davis',
          listenings: [],
        },
      ],
    })
    await userEvent.click(
      screen.getByRole('button', { name: 'Kind of Blue, Miles Davis gehört' }),
    )
    expect(
      screen.getByRole('button', {
        name: 'Rückgängig: Kind of Blue, Miles Davis',
      }),
    ).toBeInTheDocument()

    await userEvent.click(areaButton('Einstellungen'))
    await userEvent.click(areaButton('Alben'))

    expect(
      screen.queryByRole('button', {
        name: 'Rückgängig: Kind of Blue, Miles Davis',
      }),
    ).not.toBeInTheDocument()
  })

  it('marks the active area in the navigation', () => {
    renderApp()

    expect(areaButton('Alben')).toHaveAttribute('aria-current', 'page')
    expect(areaButton('Einstellungen')).not.toHaveAttribute('aria-current')
  })

  it('switches to the settings and focuses their heading', async () => {
    renderApp()

    await userEvent.click(areaButton('Einstellungen'))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Einstellungen' }),
    ).toHaveFocus()
    expect(areaButton('Einstellungen')).toHaveAttribute('aria-current', 'page')
  })

  it('has no accessibility violations on the albums page', async () => {
    const { container } = renderApp()

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('has no accessibility violations on the settings page', async () => {
    const { container } = renderApp()

    await userEvent.click(areaButton('Einstellungen'))

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('inverts the colours from the settings', async () => {
    const { appearanceClient } = renderApp()
    await userEvent.click(areaButton('Einstellungen'))

    await userEvent.click(invertedColorsCheckbox())

    expect(document.documentElement.dataset.invertedColors).toBe('true')
    expect(appearanceClient.storedColorInversion().invertedColors).toBe(true)
  })

  it('starts with remembered inverted colours', async () => {
    renderApp({ colorInversion: { invertedColors: true } })

    await userEvent.click(areaButton('Einstellungen'))

    expect(invertedColorsCheckbox()).toBeChecked()
    expect(invertedButtonsCheckbox()).not.toBeChecked()
    expect(document.documentElement.dataset.invertedColors).toBe('true')
  })

  it('inverts the buttons in addition to the colours', async () => {
    const { appearanceClient } = renderApp({
      colorInversion: { invertedColors: true },
    })
    await userEvent.click(areaButton('Einstellungen'))

    await userEvent.click(invertedButtonsCheckbox())

    expect(invertedButtonsCheckbox()).toBeChecked()
    expect(invertedColorsCheckbox()).toBeChecked()
    expect(document.documentElement.dataset.invertedButtons).toBe('true')
    expect(appearanceClient.storedColorInversion()).toEqual({
      invertedColors: true,
      invertedButtons: true,
    })
  })

  it('turns the inverted buttons off again', async () => {
    const { appearanceClient } = renderApp({
      colorInversion: { invertedButtons: true },
    })
    await userEvent.click(areaButton('Einstellungen'))

    await userEvent.click(invertedButtonsCheckbox())

    expect(invertedButtonsCheckbox()).not.toBeChecked()
    expect(appearanceClient.storedColorInversion().invertedButtons).toBe(false)
  })

  it('offers installing only while the browser offers it', async () => {
    const { installOfferClient } = renderApp()
    await userEvent.click(areaButton('Einstellungen'))
    expect(installButton()).not.toBeInTheDocument()

    act(() => installOfferClient.offer())
    expect(installButton()).toBeInTheDocument()

    act(() => installOfferClient.withdraw())
    expect(installButton()).not.toBeInTheDocument()
  })

  it('announces an accepted installation and focuses the settings heading', async () => {
    const { installOfferClient } = renderApp({ installOutcome: 'accepted' })
    act(() => installOfferClient.offer())
    await userEvent.click(areaButton('Einstellungen'))

    await userEvent.click(installButton()!)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Album-Statistics wird installiert und erscheint auf dem Startbildschirm.',
    )
    expect(installButton()).not.toBeInTheDocument()
    expect(settingsHeading()).toHaveFocus()
  })

  it('announces a dismissed installation', async () => {
    const { installOfferClient } = renderApp({ installOutcome: 'dismissed' })
    act(() => installOfferClient.offer())
    await userEvent.click(areaButton('Einstellungen'))

    await userEvent.click(installButton()!)

    expect(screen.getByRole('status')).toHaveTextContent(
      'Installation abgebrochen. Über das Browsermenü und „App installieren“ geht es jederzeit.',
    )
    expect(settingsHeading()).toHaveFocus()
  })

  it('offers a waiting update and announces it', () => {
    const { appUpdateClient } = renderApp()
    expect(
      screen.queryByRole('button', { name: 'Neue Version laden' }),
    ).not.toBeInTheDocument()

    act(() => appUpdateClient.releaseUpdate(() => {}))

    expect(
      screen.getByRole('button', { name: 'Neue Version laden' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Neue Version verfügbar. Der Knopf dafür steht ganz unten.',
    )
  })

  it('installs the update on request', async () => {
    const { appUpdateClient } = renderApp()
    const installedUpdates: string[] = []
    act(() =>
      appUpdateClient.releaseUpdate(() => installedUpdates.push('installed')),
    )

    await userEvent.click(
      screen.getByRole('button', { name: 'Neue Version laden' }),
    )

    expect(installedUpdates).toEqual(['installed'])
  })

  it('opens saving and loading data from the settings', async () => {
    renderApp()

    await openBackup()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Daten speichern und laden',
      }),
    ).toHaveFocus()
    expect(
      screen.queryByRole('button', { name: 'Alben' }),
    ).not.toBeInTheDocument()
  })

  it('returns to the settings entry for saving and loading data', async () => {
    renderApp()
    await openBackup()

    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Einstellungen' }),
    )

    expect(backupEntry()).toHaveFocus()
  })

  it('opens the settings at their heading after switching the area', async () => {
    renderApp()
    await openBackup()
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Einstellungen' }),
    )

    await userEvent.click(areaButton('Alben'))
    await userEvent.click(areaButton('Einstellungen'))

    expect(settingsHeading()).toHaveFocus()
  })

  it('has no accessibility violations on saving and loading data', async () => {
    const { container } = renderApp()

    await openBackup()

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('shows loaded albums in the album list', async () => {
    renderApp()
    await openBackup()
    const fileInput =
      document.querySelector<HTMLInputElement>('input[type="file"]')!

    await userEvent.upload(
      fileInput,
      new File(
        [
          albumsFileText([
            {
              id: 'kind-of-blue',
              title: 'Kind of Blue',
              artist: 'Miles Davis',
              listenings: ['2026-11-12T18:04:00.000Z'],
            },
          ]),
        ],
        'album-statistics-2026-11-15.json',
        { type: 'application/json' },
      ),
    )
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Daten geladen. 1 Album neu.',
      ),
    )
    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Einstellungen' }),
    )
    await userEvent.click(areaButton('Alben'))

    expect(
      screen.getByRole('heading', { level: 1, name: 'Alben, 1' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Kind of Blue, Miles Davis. Diesen Monat 1 Mal, insgesamt 1 Mal gehört.',
      }),
    ).toBeInTheDocument()
  })
})
