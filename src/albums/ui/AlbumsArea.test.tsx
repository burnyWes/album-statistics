import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import {
  createInMemoryAlbumsClient,
  type InMemoryAlbumsClient,
} from '../api/inMemoryAlbumsClient'
import type { Album } from '../domain/album'
import { listeningAt } from '../domain/listening'
import { AlbumsArea } from './AlbumsArea'

const now = new Date(2026, 10, 15, 12, 0)

const kindOfBlue: Album = {
  id: 'kind-of-blue',
  title: 'Kind of Blue',
  artist: 'Miles Davis',
  listenings: [],
}

function renderArea(
  initialAlbums: readonly Album[] = [],
  albumsClient: InMemoryAlbumsClient = createInMemoryAlbumsClient(
    initialAlbums,
  ),
) {
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
    .map((row) => row.querySelector('.albumName')?.textContent)
}

function albumButton(name: string) {
  return screen.getByRole('button', {
    name: (accessibleName) =>
      accessibleName.startsWith(`${name}. Diesen Monat`),
  })
}

function openAlbum(name: string) {
  return userEvent.click(albumButton(name))
}

async function editAlbum(name: string) {
  await openAlbum(name)
  await userEvent.click(button('Bearbeiten'))
}

function listeningsHeading(name: string) {
  return screen.getByRole('heading', { level: 2, name })
}

function listedListenings() {
  return screen
    .getAllByRole('listitem')
    .map((row) => row.querySelector('[aria-hidden="true"]')?.textContent)
}

function listenedButton(name: string) {
  return screen.getByRole('button', { name: `${name} gehört` })
}

function undoButton(name: string) {
  return screen.queryByRole('button', { name: `Rückgängig: ${name}` })
}

function button(name: string) {
  return screen.getByRole('button', { name })
}

async function replaceTitle(title: string) {
  await userEvent.clear(titleField())
  await userEvent.type(titleField(), title)
}

const listenedKindOfBlue: Album = {
  ...kindOfBlue,
  listenings: Array.from({ length: 14 }, () => '2026-11-12T18:04:00.000Z'),
}

const theWall: Album = {
  id: 'the-wall',
  title: 'The Wall',
  artist: 'Pink Floyd',
  listenings: [],
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

  it('opens an album for editing with its values', async () => {
    renderArea([kindOfBlue])

    await editAlbum('Kind of Blue, Miles Davis')

    expect(heading('Album bearbeiten')).toBeInTheDocument()
    expect(titleField()).toHaveValue('Kind of Blue')
    expect(artistField()).toHaveValue('Miles Davis')
    expect(titleField()).toHaveFocus()
  })

  it('renames an album and keeps its listenings', async () => {
    const { albumsClient, announcements } = renderArea([listenedKindOfBlue])
    await editAlbum('Kind of Blue, Miles Davis')
    await replaceTitle('Kind of Blue (Legacy Edition)')

    await userEvent.click(saveButton())

    expect(heading('Kind of Blue (Legacy Edition), Miles Davis')).toHaveFocus()
    expect(announcements).toEqual([
      'Kind of Blue (Legacy Edition), Miles Davis gespeichert.',
    ])
    expect(albumsClient.storedAlbums()).toEqual([
      { ...listenedKindOfBlue, title: 'Kind of Blue (Legacy Edition)' },
    ])
  })

  it('allows saving an album unchanged', async () => {
    const { albumsClient, announcements } = renderArea([kindOfBlue])
    await editAlbum('Kind of Blue, Miles Davis')

    await userEvent.click(saveButton())

    expect(announcements).toEqual(['Kind of Blue, Miles Davis gespeichert.'])
    expect(albumsClient.storedAlbums()).toEqual([kindOfBlue])
  })

  it('rejects renaming to another listed album', async () => {
    const { albumsClient, announcements } = renderArea([kindOfBlue, theWall])
    await editAlbum('The Wall, Pink Floyd')
    await replaceTitle('Kind of Blue')
    await userEvent.clear(artistField())
    await userEvent.type(artistField(), 'Miles Davis')

    await userEvent.click(saveButton())

    expect(announcements).toEqual(['Dieses Album gibt es schon.'])
    expect(titleField()).toHaveFocus()
    expect(albumsClient.storedAlbums()).toEqual([kindOfBlue, theWall])
  })

  it('asks before deleting and names the lost listenings', async () => {
    renderArea([listenedKindOfBlue])
    await editAlbum('Kind of Blue, Miles Davis')

    await userEvent.click(button('Löschen'))

    expect(heading('Kind of Blue, Miles Davis löschen?')).toHaveFocus()
    expect(
      screen.getByText('Damit gehen auch 14 Mal Hören verloren.'),
    ).toBeInTheDocument()
  })

  it('deletes an album and announces the remaining count', async () => {
    const { albumsClient, announcements } = renderArea([kindOfBlue, theWall])
    await editAlbum('Kind of Blue, Miles Davis')
    await userEvent.click(button('Löschen'))

    await userEvent.click(button('Löschen'))

    expect(heading('Alben, 1')).toHaveFocus()
    expect(albumRows()).toEqual(['The Wall, Pink Floyd'])
    expect(announcements).toEqual([
      'Kind of Blue, Miles Davis gelöscht. Noch 1 Album.',
    ])
    expect(albumsClient.storedAlbums()).toEqual([theWall])
  })

  it('cancels deleting back to editing', async () => {
    const { albumsClient } = renderArea([kindOfBlue])
    await editAlbum('Kind of Blue, Miles Davis')
    await userEvent.click(button('Löschen'))

    await userEvent.click(button('Abbrechen'))

    expect(heading('Album bearbeiten')).toBeInTheDocument()
    expect(albumsClient.storedAlbums()).toEqual([kindOfBlue])
  })

  it('goes back from deleting to editing', async () => {
    renderArea([kindOfBlue])
    await editAlbum('Kind of Blue, Miles Davis')
    await userEvent.click(button('Löschen'))

    await userEvent.click(button('Zurück zum Album'))

    expect(heading('Album bearbeiten')).toBeInTheDocument()
  })

  it('offers no deleting while adding', async () => {
    renderArea()

    await userEvent.click(addAlbumButton())

    expect(
      screen.queryByRole('button', { name: 'Löschen' }),
    ).not.toBeInTheDocument()
  })

  it('has no accessibility violations while editing', async () => {
    const { container } = renderArea([kindOfBlue])
    await editAlbum('Kind of Blue, Miles Davis')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('has no accessibility violations while asking before deleting', async () => {
    const { container } = renderArea([kindOfBlue])
    await editAlbum('Kind of Blue, Miles Davis')
    await userEvent.click(button('Löschen'))

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('counts a listening and announces both counts', async () => {
    const { albumsClient, announcements } = renderArea([listenedKindOfBlue])

    await userEvent.click(listenedButton('Kind of Blue, Miles Davis'))

    expect(announcements).toEqual([
      'Kind of Blue, Miles Davis gehört. Diesen Monat 15, insgesamt 15.',
    ])
    expect(listenedButton('Kind of Blue, Miles Davis')).toHaveFocus()
    expect(albumsClient.storedAlbums()[0].listenings).toHaveLength(15)
    expect(albumsClient.storedAlbums()[0].listenings.at(-1)).toBe(
      now.toISOString(),
    )
  })

  it('shows this month and total in the row', () => {
    renderArea([
      {
        ...kindOfBlue,
        listenings: ['2026-10-03T12:00:00.000Z', now.toISOString()],
      },
    ])

    const row = albumButton('Kind of Blue, Miles Davis')
    expect(row).toHaveAccessibleName(
      'Kind of Blue, Miles Davis. Diesen Monat 1 Mal, insgesamt 2 Mal gehört.',
    )
    expect(within(row).getByText('Kind of Blue, Miles Davis')).toBeVisible()
    expect(row.querySelector('.albumStats')?.textContent).toBe('12')
  })

  it('takes back the last listening', async () => {
    const { albumsClient, announcements } = renderArea([listenedKindOfBlue])
    await userEvent.click(listenedButton('Kind of Blue, Miles Davis'))

    await userEvent.click(undoButton('Kind of Blue, Miles Davis')!)

    expect(announcements.at(-1)).toBe(
      'Kind of Blue, Miles Davis: Hören zurückgenommen. Diesen Monat 14, insgesamt 14.',
    )
    expect(undoButton('Kind of Blue, Miles Davis')).not.toBeInTheDocument()
    expect(listenedButton('Kind of Blue, Miles Davis')).toHaveFocus()
    expect(albumsClient.storedAlbums()).toEqual([listenedKindOfBlue])
  })

  it('offers taking back only the latest listening', async () => {
    const { albumsClient } = renderArea([kindOfBlue, theWall])
    await userEvent.click(listenedButton('Kind of Blue, Miles Davis'))

    await userEvent.click(listenedButton('The Wall, Pink Floyd'))

    expect(undoButton('Kind of Blue, Miles Davis')).not.toBeInTheDocument()
    await userEvent.click(undoButton('The Wall, Pink Floyd')!)
    expect(
      albumsClient.storedAlbums().map((album) => album.listenings.length),
    ).toEqual([1, 0])
  })

  it('drops the undo offer when leaving the list', async () => {
    renderArea([kindOfBlue])
    await userEvent.click(listenedButton('Kind of Blue, Miles Davis'))

    await userEvent.click(addAlbumButton())
    await userEvent.click(button('Zurück zu den Alben'))

    expect(undoButton('Kind of Blue, Miles Davis')).not.toBeInTheDocument()
  })

  it('keeps listenings after reopening', async () => {
    const { albumsClient, unmount } = renderArea([kindOfBlue])
    await userEvent.click(listenedButton('Kind of Blue, Miles Davis'))
    unmount()

    renderArea([], albumsClient)

    expect(albumButton('Kind of Blue, Miles Davis')).toHaveAccessibleName(
      'Kind of Blue, Miles Davis. Diesen Monat 1 Mal, insgesamt 1 Mal gehört.',
    )
  })

  it('has no accessibility violations with the undo offer', async () => {
    const { container } = renderArea([kindOfBlue])
    await userEvent.click(listenedButton('Kind of Blue, Miles Davis'))

    expect(await accessibilityViolations(container)).toEqual([])
  })
  it('opens the album details with the focus on its name', async () => {
    renderArea([kindOfBlue])

    await openAlbum('Kind of Blue, Miles Davis')

    expect(heading('Kind of Blue, Miles Davis')).toHaveFocus()
    expect(button('Zurück zu den Alben')).toBeInTheDocument()
    expect(button('Gehört')).toBeInTheDocument()
    expect(button('Bearbeiten')).toBeInTheDocument()
  })

  it('shows both counts and the last listening', async () => {
    renderArea([
      {
        ...kindOfBlue,
        listenings: [
          listeningAt(new Date(2026, 10, 12, 14, 20)),
          listeningAt(new Date(2026, 9, 28, 19, 12)),
        ],
      },
    ])

    await openAlbum('Kind of Blue, Miles Davis')

    expect(screen.getByText('Diesen Monat 1')).toBeInTheDocument()
    expect(screen.getByText('Insgesamt 2')).toBeInTheDocument()
    const lastListened = screen.getByText(/^Zuletzt gehört:/)
    expect(
      within(lastListened).getByText('Do., 12.11.2026, 14:20'),
    ).toHaveAttribute('aria-hidden', 'true')
    expect(
      within(lastListened).getByText('Donnerstag, 12.11.2026, 14:20'),
    ).toHaveClass('visuallyHidden')
  })

  it('lists all listenings newest first', async () => {
    renderArea([
      {
        ...kindOfBlue,
        listenings: [
          listeningAt(new Date(2026, 10, 2, 21, 30)),
          listeningAt(new Date(2026, 10, 12, 14, 20)),
          listeningAt(new Date(2026, 9, 28, 19, 12)),
        ],
      },
    ])

    await openAlbum('Kind of Blue, Miles Davis')

    expect(listeningsHeading('Gehört, 3 Mal')).toBeInTheDocument()
    expect(listedListenings()).toEqual([
      'Do., 12.11.2026, 14:20',
      'Mo., 02.11.2026, 21:30',
      'Mi., 28.10.2026, 19:12',
    ])
  })

  it('shows that an album was not listened to yet', async () => {
    renderArea([kindOfBlue])

    await openAlbum('Kind of Blue, Miles Davis')

    expect(listeningsHeading('Gehört')).toBeInTheDocument()
    expect(screen.getByText('Noch nicht gehört.')).toBeInTheDocument()
    expect(screen.queryByText(/Zuletzt gehört/)).not.toBeInTheDocument()
  })

  it('counts a listening from the details', async () => {
    const { albumsClient, announcements } = renderArea([kindOfBlue])
    await openAlbum('Kind of Blue, Miles Davis')

    await userEvent.click(button('Gehört'))

    expect(announcements).toEqual([
      'Kind of Blue, Miles Davis gehört. Diesen Monat 1, insgesamt 1.',
    ])
    expect(button('Gehört')).toHaveFocus()
    expect(listeningsHeading('Gehört, 1 Mal')).toBeInTheDocument()
    expect(listedListenings()).toEqual(['So., 15.11.2026, 12:00'])
    expect(albumsClient.storedAlbums()[0].listenings).toEqual([
      now.toISOString(),
    ])
    expect(
      screen.queryByRole('button', { name: /^Rückgängig/ }),
    ).not.toBeInTheDocument()
  })

  it('goes back to the list with the focus on the album', async () => {
    renderArea([kindOfBlue, theWall])
    await openAlbum('The Wall, Pink Floyd')

    await userEvent.click(button('Zurück zu den Alben'))

    expect(albumButton('The Wall, Pink Floyd')).toHaveFocus()
  })

  it('goes back from editing to the details without saving', async () => {
    const { albumsClient } = renderArea([kindOfBlue])
    await editAlbum('Kind of Blue, Miles Davis')
    await replaceTitle('Blue Train')

    await userEvent.click(button('Zurück zum Album'))

    expect(heading('Kind of Blue, Miles Davis')).toHaveFocus()
    expect(albumsClient.storedAlbums()).toEqual([kindOfBlue])
  })

  it('saves an edited album back to the details', async () => {
    const { announcements } = renderArea([listenedKindOfBlue])
    await editAlbum('Kind of Blue, Miles Davis')

    await userEvent.click(saveButton())

    expect(heading('Kind of Blue, Miles Davis')).toHaveFocus()
    expect(listeningsHeading('Gehört, 14 Mal')).toBeInTheDocument()
    expect(announcements).toEqual(['Kind of Blue, Miles Davis gespeichert.'])
  })

  it('keeps the way back to the albums while adding', async () => {
    renderArea()

    await userEvent.click(addAlbumButton())

    expect(button('Zurück zu den Alben')).toBeInTheDocument()
  })

  it('has no accessibility violations on the details', async () => {
    const { container } = renderArea([listenedKindOfBlue])
    await openAlbum('Kind of Blue, Miles Davis')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('has no accessibility violations on the details without listenings', async () => {
    const { container } = renderArea([kindOfBlue])
    await openAlbum('Kind of Blue, Miles Davis')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})
