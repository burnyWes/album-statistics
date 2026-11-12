import { describe, expect, it } from 'vitest'
import type { Album } from '../domain/album'
import {
  albumsDownloadFile,
  albumsFileText,
  albumsFromFileText,
  albumsShareFile,
  storedAlbumsFromText,
  UnreadableAlbumsFile,
} from './albumsFile'

const kindOfBlue: Album = {
  id: 'kind-of-blue',
  title: 'Kind of Blue',
  artist: 'Miles Davis',
  spotifyLink: null,
  cover: null,
  listenings: ['2026-11-12T18:04:00.000Z'],
}

const LINK = 'https://open.spotify.com/album/kind-of-blue'

const COVER = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

function storedWithoutLinkAndCover({ id, title, artist, listenings }: Album) {
  return { id, title, artist, listenings }
}

function fileTextWith(albums: unknown, version: unknown = 1): string {
  return JSON.stringify({ version, albums })
}

describe('albums file', () => {
  it('writes all albums with version 1', () => {
    expect(JSON.parse(albumsFileText([kindOfBlue]))).toEqual({
      version: 1,
      albums: [kindOfBlue],
    })
  })

  it('reads stored albums back', () => {
    expect(storedAlbumsFromText(albumsFileText([kindOfBlue]))).toEqual([
      kindOfBlue,
    ])
  })

  it('reads stored albums without link as albums without link', () => {
    expect(
      storedAlbumsFromText(
        fileTextWith([storedWithoutLinkAndCover(kindOfBlue)]),
      ),
    ).toEqual([kindOfBlue])
  })

  it('writes and reads a link', () => {
    const linked = { ...kindOfBlue, spotifyLink: LINK }

    expect(JSON.parse(albumsFileText([linked])).albums[0].spotifyLink).toBe(
      LINK,
    )
    expect(storedAlbumsFromText(albumsFileText([linked]))).toEqual([linked])
  })

  it('reads nothing from stored albums with an invalid link', () => {
    expect(
      storedAlbumsFromText(
        fileTextWith([{ ...kindOfBlue, spotifyLink: 'javascript:alert(1)' }]),
      ),
    ).toBeNull()
  })

  it('writes and reads a cover', () => {
    const covered = { ...kindOfBlue, cover: COVER }

    expect(JSON.parse(albumsFileText([covered])).albums[0].cover).toBe(COVER)
    expect(storedAlbumsFromText(albumsFileText([covered]))).toEqual([covered])
  })

  it('reads nothing from stored albums with an invalid cover', () => {
    expect(
      storedAlbumsFromText(
        fileTextWith([
          { ...kindOfBlue, cover: 'data:image/svg+xml;base64,PA==' },
        ]),
      ),
    ).toBeNull()
  })

  it('reads nothing from unreadable text', () => {
    expect(storedAlbumsFromText('{kaputt')).toBeNull()
  })

  it('reads nothing from another version', () => {
    expect(storedAlbumsFromText(fileTextWith([kindOfBlue], 2))).toBeNull()
  })

  it('names the download file after the local date', () => {
    const file = albumsDownloadFile([], new Date(2026, 0, 4, 23, 30))

    expect(file).toEqual({
      name: 'album-statistics-2026-01-04.json',
      mimeType: 'application/json',
      text: albumsFileText([]),
    })
  })

  it('names the share file as text after the local date', () => {
    const file = albumsShareFile([kindOfBlue], new Date(2026, 10, 15, 0, 5))

    expect(file).toEqual({
      name: 'album-statistics-2026-11-15.txt',
      mimeType: 'text/plain',
      text: albumsFileText([kindOfBlue]),
    })
  })
})

describe('albumsFromFileText', () => {
  it('reads albums from a saved file', () => {
    expect(albumsFromFileText(albumsFileText([kindOfBlue]))).toEqual([
      {
        title: 'Kind of Blue',
        artist: 'Miles Davis',
        spotifyLink: null,
        cover: null,
        listenings: ['2026-11-12T18:04:00.000Z'],
      },
    ])
  })

  it('reads a file without links as albums without link', () => {
    expect(
      albumsFromFileText(
        fileTextWith([storedWithoutLinkAndCover(kindOfBlue)]),
      )[0].spotifyLink,
    ).toBeNull()
  })

  it('reads the link of an album', () => {
    expect(
      albumsFromFileText(
        albumsFileText([{ ...kindOfBlue, spotifyLink: LINK }]),
      )[0].spotifyLink,
    ).toBe(LINK)
  })

  it('reads a file without covers as albums without cover', () => {
    expect(
      albumsFromFileText(
        fileTextWith([storedWithoutLinkAndCover(kindOfBlue)]),
      )[0].cover,
    ).toBeNull()
  })

  it('reads the cover of an album', () => {
    expect(
      albumsFromFileText(albumsFileText([{ ...kindOfBlue, cover: COVER }]))[0]
        .cover,
    ).toBe(COVER)
  })

  it('rejects an album with an invalid cover', () => {
    expect(() =>
      albumsFromFileText(
        fileTextWith([{ ...kindOfBlue, cover: 'https://example.com/a.jpg' }]),
      ),
    ).toThrow(UnreadableAlbumsFile)
  })

  it('rejects an album with an invalid link', () => {
    expect(() =>
      albumsFromFileText(
        fileTextWith([{ ...kindOfBlue, spotifyLink: 'https://example.com/' }]),
      ),
    ).toThrow(UnreadableAlbumsFile)
  })

  it('rejects text that is no JSON', () => {
    expect(() => albumsFromFileText('PNG kaputt')).toThrow(UnreadableAlbumsFile)
  })

  it('rejects another version', () => {
    expect(() => albumsFromFileText(fileTextWith([kindOfBlue], 2))).toThrow(
      UnreadableAlbumsFile,
    )
  })

  it('rejects albums of the wrong shape', () => {
    expect(() =>
      albumsFromFileText(fileTextWith([{ id: 'a', title: 'A', artist: '' }])),
    ).toThrow(UnreadableAlbumsFile)
    expect(() => albumsFromFileText(JSON.stringify(null))).toThrow(
      UnreadableAlbumsFile,
    )
  })

  it('rejects an album with a blank title', () => {
    expect(() =>
      albumsFromFileText(fileTextWith([{ ...kindOfBlue, title: '  ' }])),
    ).toThrow(UnreadableAlbumsFile)
  })

  it('rejects an unreadable listening', () => {
    expect(() =>
      albumsFromFileText(
        fileTextWith([{ ...kindOfBlue, listenings: ['gestern'] }]),
      ),
    ).toThrow(UnreadableAlbumsFile)
  })
})
