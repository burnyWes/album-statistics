import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { createInMemoryAlbumsClient } from './albums/api/inMemoryAlbumsClient'
import { App } from './App'
import { createInMemoryAppearanceClient } from './shared/appearance/inMemoryAppearanceClient'
import { createInMemoryAppUpdateClient } from './shared/appUpdate/inMemoryAppUpdateClient'
import type { InstallOutcome } from './shared/install/installOfferClient'
import { createInMemoryInstallOfferClient } from './shared/install/inMemoryInstallOfferClient'
import { accessibilityViolations } from './testSupport/accessibility'

function renderApp({
  invertedColors = false,
  installOutcome = 'accepted' as InstallOutcome,
} = {}) {
  const appearanceClient = createInMemoryAppearanceClient(invertedColors)
  const installOfferClient = createInMemoryInstallOfferClient(installOutcome)
  const appUpdateClient = createInMemoryAppUpdateClient()
  const albumsClient = createInMemoryAlbumsClient()
  const rendered = render(
    <App
      appearanceClient={appearanceClient}
      installOfferClient={installOfferClient}
      appUpdateClient={appUpdateClient}
      albumsClient={albumsClient}
      clock={() => new Date(2026, 10, 15, 12, 0)}
    />,
  )
  return {
    ...rendered,
    appearanceClient,
    installOfferClient,
    appUpdateClient,
    albumsClient,
  }
}

function installButton() {
  return screen.queryByRole('button', { name: 'App installieren' })
}

function settingsHeading() {
  return screen.getByRole('heading', { level: 1, name: 'Einstellungen' })
}

function invertedColorsSwitch() {
  return screen.getByRole('switch', { name: 'Farben invertieren' })
}

function areaButton(name: string) {
  return screen.getByRole('button', { name })
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

    await userEvent.click(invertedColorsSwitch())

    expect(document.documentElement.dataset.invertedColors).toBe('true')
    expect(appearanceClient.storedInvertedColors()).toBe(true)
  })

  it('starts with remembered inverted colours', async () => {
    renderApp({ invertedColors: true })

    await userEvent.click(areaButton('Einstellungen'))

    expect(invertedColorsSwitch()).toBeChecked()
    expect(document.documentElement.dataset.invertedColors).toBe('true')
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
})
