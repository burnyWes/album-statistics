import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import { createInMemoryAlbumsClient } from '../api/inMemoryAlbumsClient'
import type { Album } from '../domain/album'
import { AlbumsArea } from './AlbumsArea'

const now = new Date(2026, 10, 15, 12, 0)

const kindOfBlue: Album = {
  id: 'kind-of-blue',
  title: 'Kind of Blue',
  artist: 'Miles Davis',
  listenings: [],
}

function renderArea(initialAlbums: readonly Album[] = []) {
  const albumsClient = createInMemoryAlbumsClient(initialAlbums)
  const announcements: string[] = []
  const rendered = render(
    <AlbumsArea
      albumsClient={albumsClient}
      clock={() => now}
      announce={(text) => announcements.push(text)}
      navigation={<nav aria-label="Bereiche" />}
    />,
  )
  return { ...rendered, albumsClient, announcements }
}

function addAlbumButton() {
  return screen.getByRole('button', { name: 'Album hinzufügen' })
}

function titleField() {
  return screen.getByRole('textbox', { name: 'Albumname' })
}

function artistField() {
  return screen.getByRole('textbox', { name: 'Bandname (optional)' })
}

function saveButton() {
  return screen.getByRole('button', { name: 'Speichern' })
}

function heading(name: string) {
  return screen.getByRole('heading', { level: 1, name })
}

function albumRows() {
  return screen
    .getAllByRole('listitem')
    .map((row) => row.querySelector('.rowButton')?.textContent)
}

async function fillIn(title: string, artist: string) {
  if (title !== '') await userEvent.type(titleField(), title)
  if (artist !== '') await userEvent.type(artistField(), artist)
}

describe('AlbumsArea', () => {
  it('opens the form with the focus in the album name', async () => {
    renderArea()

    await userEvent.click(addAlbumButton())

    expect(heading('Album hinzufügen')).toBeInTheDocument()
    expect(titleField()).toHaveFocus()
  })

  it('adds an album and announces it', async () => {
    const { albumsClient, announcements } = renderArea()
    await userEvent.click(addAlbumButton())
    await fillIn('Kind of Blue', 'Miles Davis')

    await userEvent.click(saveButton())

    expect(heading('Alben, 1')).toHaveFocus()
    expect(albumRows()).toEqual(['Kind of Blue, Miles Davis'])
    expect(announcements).toEqual(['Kind of Blue, Miles Davis gespeichert.'])
    expect(albumsClient.storedAlbums()).toEqual([
      {
        id: 'album-1',
        title: 'Kind of Blue',
        artist: 'Miles Davis',
        listenings: [],
      },
    ])
  })

  it('adds an album without artist', async () => {
    const { announcements } = renderArea()
    await userEvent.click(addAlbumButton())
    await fillIn('Greatest Hits', '')

    await userEvent.click(saveButton())

    expect(albumRows()).toEqual(['Greatest Hits'])
    expect(announcements).toEqual(['Greatest Hits gespeichert.'])
  })

  it('rejects a missing album name', async () => {
    const { albumsClient, announcements } = renderArea()
    await userEvent.click(addAlbumButton())
    await fillIn('', 'Miles Davis')

    await userEvent.click(saveButton())

    expect(
      screen.getByText('Bitte einen Albumnamen eingeben.'),
    ).toBeInTheDocument()
    expect(announcements).toEqual(['Bitte einen Albumnamen eingeben.'])
    expect(titleField()).toHaveFocus()
    expect(titleField()).toHaveAccessibleDescription(
      'Bitte einen Albumnamen eingeben.',
    )
    expect(albumsClient.storedAlbums()).toEqual([])
  })

  it('rejects an album already listed', async () => {
    const { albumsClient, announcements } = renderArea([kindOfBlue])
    await userEvent.click(addAlbumButton())
    await fillIn('kind of blue ', ' miles davis')

    await userEvent.click(saveButton())

    expect(screen.getByText('Dieses Album gibt es schon.')).toBeInTheDocument()
    expect(announcements).toEqual(['Dieses Album gibt es schon.'])
    expect(titleField()).toHaveFocus()
    expect(albumsClient.storedAlbums()).toEqual([kindOfBlue])
  })

  it('saves with the enter key', async () => {
    const { announcements } = renderArea()
    await userEvent.click(addAlbumButton())
    await fillIn('Kind of Blue', 'Miles Davis{Enter}')

    expect(heading('Alben, 1')).toHaveFocus()
    expect(announcements).toEqual(['Kind of Blue, Miles Davis gespeichert.'])
  })

  it('goes back without saving', async () => {
    const { albumsClient } = renderArea()
    await userEvent.click(addAlbumButton())
    await fillIn('Kind of Blue', 'Miles Davis')

    await userEvent.click(
      screen.getByRole('button', { name: 'Zurück zu den Alben' }),
    )

    expect(heading('Alben')).toHaveFocus()
    expect(screen.getByText('Noch keine Alben.')).toBeInTheDocument()
    expect(albumsClient.storedAlbums()).toEqual([])
  })

  it('lists albums alphabetically', () => {
    renderArea([
      { ...kindOfBlue, id: 'wall', title: 'The Wall', artist: 'Pink Floyd' },
      kindOfBlue,
      { ...kindOfBlue, id: 'hits', title: 'Greatest Hits', artist: '' },
    ])

    expect(heading('Alben, 3')).toBeInTheDocument()
    expect(albumRows()).toEqual([
      'Greatest Hits',
      'Kind of Blue, Miles Davis',
      'The Wall, Pink Floyd',
    ])
  })

  it('has no accessibility violations on the list', async () => {
    const { container } = renderArea([kindOfBlue])

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('has no accessibility violations in the form', async () => {
    const { container } = renderArea()
    await userEvent.click(addAlbumButton())
    await userEvent.click(saveButton())

    expect(await accessibilityViolations(container)).toEqual([])
  })
})
