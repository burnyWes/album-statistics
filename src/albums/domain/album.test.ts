import { describe, expect, it } from 'vitest'
import {
  albumName,
  byTitle,
  InvalidAlbum,
  newAlbum,
  type Album,
  type NewAlbum,
} from './album'

const kindOfBlue: NewAlbum = { title: 'Kind of Blue', artist: 'Miles Davis' }

function album(title: string, artist = ''): Album {
  return { id: `${title}/${artist}`, title, artist, listenings: [] }
}

function titlesAndArtists(albums: readonly Album[]) {
  return albums.map((sorted) => albumName(sorted))
}

describe('newAlbum', () => {
  it('keeps title and artist without surrounding blanks', () => {
    expect(
      newAlbum({ title: '  Kind of Blue ', artist: ' Miles Davis  ' }, []),
    ).toEqual(kindOfBlue)
  })

  it('accepts an album without artist', () => {
    expect(newAlbum({ title: 'Greatest Hits', artist: '  ' }, [])).toEqual({
      title: 'Greatest Hits',
      artist: '',
    })
  })

  it('rejects an album without title', () => {
    expect(() => newAlbum({ title: '   ', artist: 'Miles Davis' }, [])).toThrow(
      new InvalidAlbum('titleMissing'),
    )
  })

  it('rejects an album already listed regardless of case and blanks', () => {
    expect(() =>
      newAlbum({ title: ' kind of blue', artist: 'MILES DAVIS ' }, [
        kindOfBlue,
      ]),
    ).toThrow(new InvalidAlbum('alreadyListed'))
  })

  it('accepts the same title by another artist', () => {
    expect(
      newAlbum({ title: 'Kind of Blue', artist: 'John Coltrane' }, [
        kindOfBlue,
      ]),
    ).toEqual({ title: 'Kind of Blue', artist: 'John Coltrane' })
  })

  it('accepts the same title without artist', () => {
    expect(
      newAlbum({ title: 'Kind of Blue', artist: '' }, [kindOfBlue]),
    ).toEqual({ title: 'Kind of Blue', artist: '' })
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
