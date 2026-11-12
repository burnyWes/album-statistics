import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { ShareOutcome } from '../../shared/files/fileExportClient'
import { createInMemoryFileExportClient } from '../../shared/files/inMemoryFileExportClient'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { albumsFileText } from '../api/albumsFile'
import { createInMemoryAlbumsClient } from '../api/inMemoryAlbumsClient'
import type { Album } from '../domain/album'
import { AlbumsBackupPage } from './AlbumsBackupPage'

const now = new Date(2026, 10, 15, 12, 0)

const kindOfBlue: Album = {
  id: 'kind-of-blue',
  title: 'Kind of Blue',
  artist: 'Miles Davis',
  spotifyLink: null,
  cover: null,
  listenings: ['2026-11-12T18:04:00.000Z'],
}

const theWall: Album = {
  id: 'the-wall',
  title: 'The Wall',
  artist: 'Pink Floyd',
  spotifyLink: null,
  cover: null,
  listenings: [],
}

const blueTrain: Album = {
  id: 'blue-train',
  title: 'Blue Train',
  artist: 'John Coltrane',
  spotifyLink: null,
  cover: null,
  listenings: ['2026-11-10T20:00:00.000Z'],
}

function renderPage({
  albums = [kindOfBlue, theWall] as readonly Album[],
  shareable = false,
  shareOutcome = 'shared' as ShareOutcome,
  storageFull = false,
} = {}) {
  const albumsClient = createInMemoryAlbumsClient(albums)
  if (storageFull) albumsClient.storageFull()
  const fileExportClient = createInMemoryFileExportClient({
    shareable,
    shareOutcome,
  })
  const announcements: string[] = []
  const backs: string[] = []
  const rendered = render(
    <AlbumsBackupPage
      albumsClient={albumsClient}
      clock={() => now}
      fileExportClient={fileExportClient}
      announce={(text) => announcements.push(text)}
      onBack={() => backs.push('back')}
    />,
  )
  return { ...rendered, albumsClient, fileExportClient, announcements, backs }
}

function button(name: string) {
  return screen.getByRole('button', { name })
}

function fileInput() {
  return document.querySelector<HTMLInputElement>('input[type="file"]')!
}

function backupFile(
  albums: readonly Album[],
  name = 'album-statistics-2026-11-15.json',
  type = 'application/json',
) {
  return new File([albumsFileText(albums)], name, { type })
}

const storageFullMessage = 'Der Speicher ist voll. Es wurde nichts geändert.'

const unreadableMessage =
  'Diese Datei enthält keine lesbaren Album-Daten. Es wurde nichts geändert.'

describe('AlbumsBackupPage', () => {
  it('focuses the heading when opened', () => {
    renderPage()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Daten speichern / laden',
      }),
    ).toHaveFocus()
  })

  it('downloads all albums as a dated file', async () => {
    const { fileExportClient, announcements } = renderPage()

    await userEvent.click(button('Daten speichern'))

    const [downloaded] = fileExportClient.downloadedFiles()
    expect(downloaded.name).toBe('album-statistics-2026-11-15.json')
    expect(JSON.parse(downloaded.text).albums).toEqual([kindOfBlue, theWall])
    expect(announcements).toEqual([
      'Daten gespeichert als album-statistics-2026-11-15.json.',
    ])
  })

  it('goes back to the settings', async () => {
    const { backs } = renderPage()

    await userEvent.click(button('Zurück zu den Einstellungen'))

    expect(backs).toEqual(['back'])
  })

  it('opens the file selection from loading data', async () => {
    renderPage()
    const clicks: string[] = []
    fileInput().addEventListener('click', () => clicks.push('clicked'))

    await userEvent.click(button('Daten laden'))

    expect(clicks).toEqual(['clicked'])
  })

  it('merges a loaded file and announces what was added', async () => {
    const { albumsClient, announcements } = renderPage()

    await userEvent.upload(
      fileInput(),
      backupFile([
        { ...kindOfBlue, listenings: ['2026-11-13T18:04:00.000Z'] },
        blueTrain,
      ]),
    )

    await waitFor(() =>
      expect(announcements).toEqual([
        'Daten geladen. 1 Album neu, 1 Album ergänzt.',
      ]),
    )
    expect(albumsClient.storedAlbums()).toEqual([
      {
        ...kindOfBlue,
        listenings: ['2026-11-12T18:04:00.000Z', '2026-11-13T18:04:00.000Z'],
      },
      theWall,
      { ...blueTrain, id: 'album-1' },
    ])
    expect(button('Daten laden')).toHaveFocus()
  })

  it('announces that a loaded file brought nothing new', async () => {
    const { announcements } = renderPage()

    await userEvent.upload(fileInput(), backupFile([kindOfBlue, theWall]))

    await waitFor(() =>
      expect(announcements).toEqual([
        'Daten geladen. Es war nichts Neues dabei.',
      ]),
    )
  })

  it('loads a shared text file', async () => {
    const { albumsClient, announcements } = renderPage({ albums: [] })

    await userEvent.upload(
      fileInput(),
      backupFile([blueTrain], 'album-statistics-2026-11-15.txt', 'text/plain'),
    )

    await waitFor(() =>
      expect(announcements).toEqual(['Daten geladen. 1 Album neu.']),
    )
    expect(albumsClient.storedAlbums()).toHaveLength(1)
  })

  it('rejects an unreadable file and keeps the albums', async () => {
    const { albumsClient, announcements } = renderPage()

    await userEvent.upload(
      fileInput(),
      new File(['kein JSON'], 'foto.txt', { type: 'text/plain' }),
    )

    await waitFor(() => expect(announcements).toEqual([unreadableMessage]))
    expect(screen.getByText(unreadableMessage)).toBeInTheDocument()
    expect(albumsClient.storedAlbums()).toEqual([kindOfBlue, theWall])
    expect(button('Daten laden')).toHaveFocus()
  })

  it('tells about a full storage and keeps the albums', async () => {
    const { albumsClient, announcements } = renderPage({ storageFull: true })

    await userEvent.upload(fileInput(), backupFile([blueTrain]))

    await waitFor(() => expect(announcements).toEqual([storageFullMessage]))
    expect(screen.getByText(storageFullMessage)).toBeInTheDocument()
    expect(albumsClient.storedAlbums()).toEqual([kindOfBlue, theWall])
    expect(button('Daten laden')).toHaveFocus()
  })

  it('clears the failure after a successful load', async () => {
    renderPage()
    await userEvent.upload(
      fileInput(),
      new File(['kein JSON'], 'foto.txt', { type: 'text/plain' }),
    )
    await screen.findByText(unreadableMessage)

    await userEvent.upload(fileInput(), backupFile([kindOfBlue]))

    await waitFor(() =>
      expect(screen.queryByText(unreadableMessage)).not.toBeInTheDocument(),
    )
  })

  it('offers sharing only when the browser can share the file', () => {
    renderPage({ shareable: false })
    expect(
      screen.queryByRole('button', { name: 'Daten teilen' }),
    ).not.toBeInTheDocument()
  })

  it('shares the albums as a dated text file and announces it', async () => {
    const { fileExportClient, announcements } = renderPage({ shareable: true })

    await userEvent.click(button('Daten teilen'))

    await waitFor(() => expect(announcements).toEqual(['Daten geteilt.']))
    const [shared] = fileExportClient.sharedFiles()
    expect(shared.name).toBe('album-statistics-2026-11-15.txt')
    expect(shared.mimeType).toBe('text/plain')
  })

  it('announces a dismissed share', async () => {
    const { announcements } = renderPage({
      shareable: true,
      shareOutcome: 'dismissed',
    })

    await userEvent.click(button('Daten teilen'))

    await waitFor(() => expect(announcements).toEqual(['Teilen abgebrochen.']))
  })

  it('announces a failed share', async () => {
    const { announcements } = renderPage({
      shareable: true,
      shareOutcome: 'failed',
    })

    await userEvent.click(button('Daten teilen'))

    await waitFor(() =>
      expect(announcements).toEqual(['Teilen hat nicht geklappt.']),
    )
  })

  it('has no accessibility violations', async () => {
    const { container } = renderPage({ shareable: true })
    await userEvent.upload(
      fileInput(),
      new File(['kein JSON'], 'foto.txt', { type: 'text/plain' }),
    )
    await screen.findByText(unreadableMessage)

    expect(await accessibilityViolations(container)).toEqual([])
  })
})
