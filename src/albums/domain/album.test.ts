import { describe, expect, it } from 'vitest'
import {
  albumName,
  byTitle,
  InvalidAlbum,
  newAlbum,
  type Album,
  type NewAlbum,
} from './album'

const kindOfBlue: NewAlbum = {
  title: 'Kind of Blue',
  artist: 'Miles Davis',
  spotifyLink: null,
  cover: null,
}

function draft(title: string, artist: string, spotifyLink = '') {
  return { title, artist, spotifyLink, cover: null }
}

const COVER = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

function album(title: string, artist = ''): Album {
  return {
    id: `${title}/${artist}`,
    title,
    artist,
    spotifyLink: null,
    cover: null,
    listenings: [],
  }
}

function titlesAndArtists(albums: readonly Album[]) {
  return albums.map((sorted) => albumName(sorted))
}

describe('newAlbum', () => {
  it('keeps title and artist without surrounding blanks', () => {
    expect(newAlbum(draft('  Kind of Blue ', ' Miles Davis  '), [])).toEqual(
      kindOfBlue,
    )
  })

  it('accepts an album without artist', () => {
    expect(newAlbum(draft('Greatest Hits', '  '), [])).toEqual({
      title: 'Greatest Hits',
      artist: '',
      spotifyLink: null,
      cover: null,
    })
  })

  it('rejects an album without title', () => {
    expect(() => newAlbum(draft('   ', 'Miles Davis'), [])).toThrow(
      new InvalidAlbum('titleMissing'),
    )
  })

  it('rejects an album already listed regardless of case and blanks', () => {
    expect(() =>
      newAlbum(draft(' kind of blue', 'MILES DAVIS '), [kindOfBlue]),
    ).toThrow(new InvalidAlbum('alreadyListed'))
  })

  it('accepts the same title by another artist', () => {
    expect(
      newAlbum(draft('Kind of Blue', 'John Coltrane'), [kindOfBlue]),
    ).toEqual({ ...kindOfBlue, artist: 'John Coltrane' })
  })

  it('accepts the same title without artist', () => {
    expect(newAlbum(draft('Kind of Blue', ''), [kindOfBlue])).toEqual({
      ...kindOfBlue,
      artist: '',
    })
  })
})

describe('newAlbum with a spotify link', () => {
  it('keeps the normalised link', () => {
    expect(
      newAlbum(
        draft('Kind of Blue', 'Miles Davis', ' open.spotify.com/album/x '),
        [],
      ).spotifyLink,
    ).toBe('https://open.spotify.com/album/x')
  })

  it('keeps no link for a blank one', () => {
    expect(
      newAlbum(draft('Kind of Blue', 'Miles Davis', '   '), []).spotifyLink,
    ).toBeNull()
  })

  it('rejects a link that is no spotify link', () => {
    expect(() =>
      newAlbum(draft('Kind of Blue', 'Miles Davis', 'https://example.com'), []),
    ).toThrow(new InvalidAlbum('spotifyLinkInvalid'))
  })

  it('asks for the title before the link', () => {
    expect(() => newAlbum(draft('  ', '', 'foo'), [])).toThrow(
      new InvalidAlbum('titleMissing'),
    )
  })

  it('names an invalid link before an album already listed', () => {
    expect(() =>
      newAlbum(draft('Kind of Blue', 'Miles Davis', 'foo'), [kindOfBlue]),
    ).toThrow(new InvalidAlbum('spotifyLinkInvalid'))
  })
})

describe('newAlbum with a cover', () => {
  it('keeps the cover unchanged', () => {
    expect(
      newAlbum({ ...draft('Kind of Blue', 'Miles Davis'), cover: COVER }, [])
        .cover,
    ).toBe(COVER)
  })

  it('keeps no cover without one', () => {
    expect(newAlbum(draft('Kind of Blue', 'Miles Davis'), []).cover).toBeNull()
  })
})

describe('byTitle', () => {
  it('sorts by German collation with numbers in order', () => {
    const sorted = byTitle([
      album('The Wall'),
      album('Vol. 10'),
      album('Bach'),
      album('abba', 'x'),
      album('Vol. 2'),
      album('Ägypten'),
      album('ABBA', 'y'),
      album('Zebra'),
    ])

    expect(sorted.map((each) => each.title)).toEqual([
      'abba',
      'ABBA',
      'Ägypten',
      'Bach',
      'The Wall',
      'Vol. 2',
      'Vol. 10',
      'Zebra',
    ])
  })

  it('orders equal titles by artist, without artist first', () => {
    const sorted = byTitle([
      album('Greatest Hits', 'Queen'),
      album('Greatest Hits', 'ABBA'),
      album('Greatest Hits'),
    ])

    expect(titlesAndArtists(sorted)).toEqual([
      'Greatest Hits',
      'Greatest Hits, ABBA',
      'Greatest Hits, Queen',
    ])
  })
})

describe('albumName', () => {
  it('joins title and artist', () => {
    expect(albumName(kindOfBlue)).toBe('Kind of Blue, Miles Davis')
  })

  it('shows only the title without artist', () => {
    expect(albumName({ title: 'Greatest Hits', artist: '' })).toBe(
      'Greatest Hits',
    )
  })
})
