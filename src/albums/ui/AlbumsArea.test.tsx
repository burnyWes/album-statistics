import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../../testSupport/accessibility'
import {
  createInMemoryAlbumsClient,
  type InMemoryAlbumsClient,
} from '../api/inMemoryAlbumsClient'
import {
  createInMemoryCoverImageClient,
  TEST_COVER,
  type InMemoryCoverImageClient,
} from '../api/inMemoryCoverImageClient'
import type { Album } from '../domain/album'
import { listeningAt } from '../domain/listening'
import { AlbumsArea } from './AlbumsArea'

const now = new Date(2026, 10, 15, 12, 0)

const kindOfBlue: Album = {
  id: 'kind-of-blue',
  title: 'Kind of Blue',
  artist: 'Miles Davis',
  spotifyLink: null,
  cover: null,
  listenings: [],
}

function renderArea(
  initialAlbums: readonly Album[] = [],
  albumsClient: InMemoryAlbumsClient = createInMemoryAlbumsClient(
    initialAlbums,
  ),
  coverImageClient: InMemoryCoverImageClient = createInMemoryCoverImageClient(),
) {
  const announcements: string[] = []
  const rendered = render(
    <AlbumsArea
      albumsClient={albumsClient}
      coverImageClient={coverImageClient}
      clock={() => now}
      announce={(text) => announcements.push(text)}
      navigation={<nav aria-label="Bereiche" />}
    />,
  )
  return { ...rendered, albumsClient, coverImageClient, announcements }
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

function spotifyLinkField() {
  return screen.getByRole('textbox', { name: 'Spotify-Link (optional)' })
}

function spotifyLinkButton() {
  return screen.queryByRole('link', { name: 'Auf Spotify öffnen' })
}

function coverInput() {
  return document.querySelector<HTMLInputElement>('input[type="file"]')!
}

function chooseCover(fileName = 'cover.png') {
  return userEvent.upload(
    coverInput(),
    new File(['png'], fileName, { type: 'image/png' }),
  )
}

function coverImage() {
  return screen.queryByRole('img', { name: 'Album-Cover' })
}

const storageFull = 'Der Speicher ist voll. Es wurde nichts geändert.'

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
  spotifyLink: null,
  cover: null,
  listenings: [],
}

async function fillIn(title: string, artist: string) {
  if (title !== '') await userEvent.type(titleField(), title)
  if (artist !== '') await userEvent.type(artistField(), artist)
}

const thursdayListening = listeningAt(new Date(2026, 10, 12, 14, 20))

const octoberListening = listeningAt(new Date(2026, 9, 28, 19, 12))

const listenedOnThursdayAndInOctober: Album = {
  ...kindOfBlue,
  listenings: [octoberListening, thursdayListening],
}

const deleteThursdayListening =
  'Hören vom Donnerstag, 12.11.2026, 14:20 löschen'

function deleteListeningButtons() {
  return screen.getAllByRole('button', { name: /^Hören vom .* löschen$/ })
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
        spotifyLink: null,
        cover: null,
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

  it('groups the listenings under headings for each month listened in', async () => {
    renderArea([
      {
        ...kindOfBlue,
        listenings: [
          listeningAt(new Date(2026, 7, 14, 20, 0)),
          listeningAt(new Date(2026, 10, 2, 21, 30)),
          listeningAt(new Date(2026, 10, 12, 14, 20)),
        ],
      },
    ])

    await openAlbum('Kind of Blue, Miles Davis')

    expect(
      screen
        .getAllByRole('heading', { level: 3 })
        .map((monthHeading) => monthHeading.textContent),
    ).toEqual(['November 2026', 'August 2026'])
    const november = screen.getByRole('list', { name: 'November 2026' })
    expect(within(november).getAllByRole('listitem')).toHaveLength(2)
    const august = screen.getByRole('list', { name: 'August 2026' })
    expect(within(august).getAllByRole('listitem')).toHaveLength(1)
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
  it('asks before deleting a listening', async () => {
    renderArea([listenedOnThursdayAndInOctober])
    await openAlbum('Kind of Blue, Miles Davis')

    await userEvent.click(button(deleteThursdayListening))

    expect(
      heading('Hören vom Donnerstag, 12.11.2026, 14:20 löschen?'),
    ).toHaveFocus()
    expect(screen.getByText('Kind of Blue, Miles Davis')).toBeInTheDocument()
  })

  it('deletes a listening and announces both counts', async () => {
    const { albumsClient, announcements } = renderArea([
      listenedOnThursdayAndInOctober,
    ])
    await openAlbum('Kind of Blue, Miles Davis')
    await userEvent.click(button(deleteThursdayListening))

    await userEvent.click(button('Löschen'))

    expect(listeningsHeading('Gehört, 1 Mal')).toHaveFocus()
    expect(announcements).toEqual([
      'Hören vom Donnerstag, 12.11.2026, 14:20 gelöscht. Diesen Monat 0, insgesamt 1.',
    ])
    expect(albumsClient.storedAlbums()[0].listenings).toEqual([
      octoberListening,
    ])
  })

  it('deletes only one of equal listenings', async () => {
    const { albumsClient } = renderArea([listenedKindOfBlue])
    await openAlbum('Kind of Blue, Miles Davis')
    await userEvent.click(deleteListeningButtons()[0])

    await userEvent.click(button('Löschen'))

    expect(listeningsHeading('Gehört, 13 Mal')).toHaveFocus()
    expect(albumsClient.storedAlbums()[0].listenings).toHaveLength(13)
  })

  it('focuses the plain listenings heading after deleting the last listening', async () => {
    renderArea([{ ...kindOfBlue, listenings: [thursdayListening] }])
    await openAlbum('Kind of Blue, Miles Davis')
    await userEvent.click(button(deleteThursdayListening))

    await userEvent.click(button('Löschen'))

    expect(listeningsHeading('Gehört')).toHaveFocus()
    expect(screen.getByText('Noch nicht gehört.')).toBeInTheDocument()
  })

  it('cancels deleting a listening back to the details', async () => {
    const { albumsClient } = renderArea([listenedOnThursdayAndInOctober])
    await openAlbum('Kind of Blue, Miles Davis')
    await userEvent.click(button(deleteThursdayListening))

    await userEvent.click(button('Abbrechen'))

    expect(heading('Kind of Blue, Miles Davis')).toHaveFocus()
    expect(albumsClient.storedAlbums()).toEqual([
      listenedOnThursdayAndInOctober,
    ])
  })

  it('goes back from deleting a listening to the details', async () => {
    renderArea([listenedOnThursdayAndInOctober])
    await openAlbum('Kind of Blue, Miles Davis')
    await userEvent.click(button(deleteThursdayListening))

    await userEvent.click(button('Zurück zum Album'))

    expect(heading('Kind of Blue, Miles Davis')).toHaveFocus()
  })

  it('has no accessibility violations while asking before deleting a listening', async () => {
    const { container } = renderArea([listenedOnThursdayAndInOctober])
    await openAlbum('Kind of Blue, Miles Davis')
    await userEvent.click(button(deleteThursdayListening))

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('opens a saved spotify link from the details', async () => {
    const { albumsClient } = renderArea()
    await userEvent.click(addAlbumButton())
    await fillIn('Kind of Blue', 'Miles Davis')
    await userEvent.type(spotifyLinkField(), ' open.spotify.com/album/x ')
    await userEvent.click(saveButton())

    await openAlbum('Kind of Blue, Miles Davis')

    const link = spotifyLinkButton()
    expect(link).toHaveAttribute('href', 'https://open.spotify.com/album/x')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener')
    expect(albumsClient.storedAlbums()[0].spotifyLink).toBe(
      'https://open.spotify.com/album/x',
    )
  })

  it('offers no spotify link for an album without one', async () => {
    renderArea([kindOfBlue])

    await openAlbum('Kind of Blue, Miles Davis')

    expect(spotifyLinkButton()).not.toBeInTheDocument()
  })

  it('rejects a link that is no spotify link', async () => {
    const { albumsClient, announcements } = renderArea()
    await userEvent.click(addAlbumButton())
    await fillIn('Kind of Blue', 'Miles Davis')
    await userEvent.type(spotifyLinkField(), 'https://example.com')

    await userEvent.click(saveButton())

    expect(screen.getByText('Das ist kein Spotify-Link.')).toBeInTheDocument()
    expect(announcements).toEqual(['Das ist kein Spotify-Link.'])
    expect(spotifyLinkField()).toHaveFocus()
    expect(spotifyLinkField()).toHaveAccessibleDescription(
      'Das ist kein Spotify-Link.',
    )
    expect(albumsClient.storedAlbums()).toEqual([])
  })

  it('edits and removes a saved spotify link', async () => {
    const link = 'https://open.spotify.com/album/x'
    const { albumsClient } = renderArea([{ ...kindOfBlue, spotifyLink: link }])
    await editAlbum('Kind of Blue, Miles Davis')

    expect(spotifyLinkField()).toHaveValue(link)
    await userEvent.clear(spotifyLinkField())
    await userEvent.click(saveButton())

    expect(spotifyLinkButton()).not.toBeInTheDocument()
    expect(albumsClient.storedAlbums()).toEqual([kindOfBlue])
  })

  it('has no accessibility violations on the details with a spotify link', async () => {
    const { container } = renderArea([
      { ...kindOfBlue, spotifyLink: 'https://open.spotify.com/album/x' },
    ])
    await openAlbum('Kind of Blue, Miles Davis')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('chooses a cover with a preview and announces it', async () => {
    const { announcements } = renderArea()
    await userEvent.click(addAlbumButton())
    await userEvent.click(button('Cover wählen'))

    await chooseCover()

    expect(
      await screen.findByRole('img', { name: 'Album-Cover' }),
    ).toHaveAttribute('src', TEST_COVER)
    expect(announcements).toEqual(['Cover gewählt.'])
    expect(button('Cover ändern')).toHaveFocus()
    expect(button('Cover entfernen')).toBeInTheDocument()
  })

  it('locks saving while the cover is processed', async () => {
    const { coverImageClient } = renderArea()
    coverImageClient.holdBack()
    await userEvent.click(addAlbumButton())

    await chooseCover()

    expect(saveButton()).toBeDisabled()
    coverImageClient.deliver()
    await waitFor(() => expect(saveButton()).toBeEnabled())
  })

  it('clears a failure after choosing a cover', async () => {
    renderArea()
    await userEvent.click(addAlbumButton())
    await userEvent.click(saveButton())

    await chooseCover()

    await waitFor(() =>
      expect(
        screen.queryByText('Bitte einen Albumnamen eingeben.'),
      ).not.toBeInTheDocument(),
    )
  })

  it('shows a saved cover in the list and on the details', async () => {
    const { albumsClient } = renderArea()
    await userEvent.click(addAlbumButton())
    await fillIn('Kind of Blue', 'Miles Davis')
    await chooseCover()
    await screen.findByRole('img', { name: 'Album-Cover' })

    await userEvent.click(saveButton())

    const row = albumButton('Kind of Blue, Miles Davis')
    expect(row).toHaveAccessibleName(
      'Kind of Blue, Miles Davis. Diesen Monat 0 Mal, insgesamt 0 Mal gehört.',
    )
    expect(row.querySelector('img')).toHaveAttribute('src', TEST_COVER)
    expect(row.querySelector('img')).toHaveAttribute('alt', '')
    expect(albumsClient.storedAlbums()[0].cover).toBe(TEST_COVER)
    await openAlbum('Kind of Blue, Miles Davis')
    expect(coverImage()).toHaveAttribute('src', TEST_COVER)
  })

  it('shows a placeholder for an album without cover', async () => {
    renderArea([kindOfBlue])

    expect(
      albumButton('Kind of Blue, Miles Davis').querySelector(
        '.albumCoverPlaceholder',
      ),
    ).toHaveAttribute('aria-hidden', 'true')
    await openAlbum('Kind of Blue, Miles Davis')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('removes a cover', async () => {
    const { albumsClient, announcements } = renderArea([
      { ...kindOfBlue, cover: TEST_COVER },
    ])
    await editAlbum('Kind of Blue, Miles Davis')

    await userEvent.click(button('Cover entfernen'))

    expect(announcements).toEqual(['Cover entfernt.'])
    expect(button('Cover wählen')).toHaveFocus()
    expect(coverImage()).not.toBeInTheDocument()
    await userEvent.click(saveButton())
    expect(albumsClient.storedAlbums()).toEqual([kindOfBlue])
  })

  it('keeps the cover when an image cannot be read', async () => {
    const { announcements } = renderArea([{ ...kindOfBlue, cover: TEST_COVER }])
    await editAlbum('Kind of Blue, Miles Davis')

    await chooseCover('unreadable.png')

    expect(
      await screen.findByText('Dieses Bild konnte nicht gelesen werden.'),
    ).toBeInTheDocument()
    expect(announcements).toEqual(['Dieses Bild konnte nicht gelesen werden.'])
    expect(coverImage()).toHaveAttribute('src', TEST_COVER)
  })

  it('drops a chosen cover when going back', async () => {
    const { albumsClient } = renderArea([kindOfBlue])
    await editAlbum('Kind of Blue, Miles Davis')
    await chooseCover()
    await screen.findByRole('img', { name: 'Album-Cover' })

    await userEvent.click(button('Zurück zum Album'))

    expect(coverImage()).not.toBeInTheDocument()
    expect(albumsClient.storedAlbums()).toEqual([kindOfBlue])
  })

  it('keeps the form open when the storage is full', async () => {
    const { albumsClient, announcements } = renderArea()
    albumsClient.storageFull()
    await userEvent.click(addAlbumButton())
    await fillIn('Kind of Blue', 'Miles Davis{Enter}')

    expect(screen.getByText(storageFull)).toBeInTheDocument()
    expect(announcements).toEqual([storageFull])
    expect(heading('Album hinzufügen')).toBeInTheDocument()
    expect(saveButton()).toHaveFocus()
    await userEvent.click(button('Zurück zu den Alben'))
    expect(screen.getByText('Noch keine Alben.')).toBeInTheDocument()
  })

  it('only announces a full storage when counting a listening', async () => {
    const { albumsClient, announcements } = renderArea([kindOfBlue])
    albumsClient.storageFull()

    await userEvent.click(listenedButton('Kind of Blue, Miles Davis'))

    expect(announcements).toEqual([storageFull])
    expect(albumButton('Kind of Blue, Miles Davis')).toHaveAccessibleName(
      /insgesamt 0 Mal gehört/,
    )
    expect(undoButton('Kind of Blue, Miles Davis')).not.toBeInTheDocument()

    await openAlbum('Kind of Blue, Miles Davis')
    await userEvent.click(button('Gehört'))

    expect(announcements).toEqual([storageFull, storageFull])
    expect(listeningsHeading('Gehört')).toBeInTheDocument()
  })

  it('has no accessibility violations in the form with a cover', async () => {
    const { container } = renderArea([{ ...kindOfBlue, cover: TEST_COVER }])
    await editAlbum('Kind of Blue, Miles Davis')

    expect(await accessibilityViolations(container)).toEqual([])
  })

  it('has no accessibility violations on the list and details with a cover', async () => {
    const { container } = renderArea([
      { ...kindOfBlue, cover: TEST_COVER },
      theWall,
    ])
    expect(await accessibilityViolations(container)).toEqual([])

    await openAlbum('Kind of Blue, Miles Davis')

    expect(await accessibilityViolations(container)).toEqual([])
  })
})
