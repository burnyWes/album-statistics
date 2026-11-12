import { describe, expect, it } from 'vitest'
import type { Album } from './album'
import { isLoadableAlbum, mergeAlbums, type LoadedAlbum } from './albumMerge'

const A = '2026-11-01T18:00:00.000Z'
const B = '2026-11-02T18:00:00.000Z'
const C = '2026-11-03T18:00:00.000Z'
const D = '2026-11-04T18:00:00.000Z'
const E = '2026-11-05T18:00:00.000Z'

function loadedIds() {
  let next = 1
  return () => {
    const id = `loaded-${next}`
    next += 1
    return id
  }
}

const kindOfBlue: Album = {
  id: 'kind-of-blue',
  title: 'Kind of Blue',
  artist: 'Miles Davis',
  listenings: [A, A, B],
}

function loaded(
  title: string,
  artist: string,
  listenings: string[] = [],
): LoadedAlbum {
  return { title, artist, listenings }
}

describe('mergeAlbums', () => {
  it('adds albums that are not present yet', () => {
    const merge = mergeAlbums(
      [],
      [loaded('  The Wall ', ' Pink Floyd ', [D])],
      loadedIds(),
    )

    expect(merge.albums).toEqual([
      {
        id: 'loaded-1',
        title: 'The Wall',
        artist: 'Pink Floyd',
        listenings: [D],
      },
    ])
    expect(merge.addedAlbums).toBe(1)
  })

  it('recognises a present album regardless of case, accents and blanks', () => {
    const merge = mergeAlbums(
      [{ ...kindOfBlue, title: 'Café Blue', listenings: [] }],
      [loaded(' cafe BLUE ', 'MILES DAVIS ', [A])],
      loadedIds(),
    )

    expect(merge.albums).toEqual([
      { ...kindOfBlue, title: 'Café Blue', listenings: [A] },
    ])
    expect(merge.addedAlbums).toBe(0)
  })

  it('adds listenings missing on the device', () => {
    const merge = mergeAlbums(
      [kindOfBlue],
      [loaded('Kind of Blue', 'Miles Davis', [C])],
      loadedIds(),
    )

    expect(merge.albums[0].listenings).toEqual([A, A, B, C])
    expect(merge.extendedAlbums).toBe(1)
    expect(merge.addedListenings).toBe(1)
  })

  it('keeps the higher count of equal listenings', () => {
    const merge = mergeAlbums(
      [kindOfBlue],
      [loaded('Kind of Blue', 'Miles Davis', [A, C])],
      loadedIds(),
    )

    expect(merge.albums[0].listenings).toEqual([A, A, B, C])

    const moreOnFile = mergeAlbums(
      [{ ...kindOfBlue, listenings: [A] }],
      [loaded('Kind of Blue', 'Miles Davis', [A, A, A])],
      loadedIds(),
    )

    expect(moreOnFile.albums[0].listenings).toEqual([A, A, A])
    expect(moreOnFile.addedListenings).toBe(2)
  })

  it('compares listenings by time, not by text', () => {
    const merge = mergeAlbums(
      [{ ...kindOfBlue, listenings: ['2026-11-12T18:00:00.000Z'] }],
      [loaded('Kind of Blue', 'Miles Davis', ['2026-11-12T19:00:00+01:00'])],
      loadedIds(),
    )

    expect(merge.albums[0].listenings).toEqual(['2026-11-12T18:00:00.000Z'])
    expect(merge.addedListenings).toBe(0)
  })

  it('changes nothing when merging the same albums again', () => {
    const present = [kindOfBlue]

    const merge = mergeAlbums(present, present, loadedIds())

    expect(merge).toEqual({
      albums: present,
      addedAlbums: 0,
      extendedAlbums: 0,
      addedListenings: 0,
    })
  })

  it('merges equal albums within the loaded albums', () => {
    const merge = mergeAlbums(
      [kindOfBlue],
      [
        loaded('kind of blue', 'MILES DAVIS', [A, C]),
        loaded('The Wall', 'Pink Floyd', [D]),
        loaded('THE WALL', 'Pink Floyd', [D, E]),
      ],
      loadedIds(),
    )

    expect(merge).toEqual({
      albums: [
        { ...kindOfBlue, listenings: [A, A, B, C] },
        {
          id: 'loaded-1',
          title: 'The Wall',
          artist: 'Pink Floyd',
          listenings: [D, E],
        },
      ],
      addedAlbums: 1,
      extendedAlbums: 1,
      addedListenings: 1,
    })
  })

  it('keeps albums only present on the device', () => {
    const merge = mergeAlbums(
      [kindOfBlue],
      [loaded('The Wall', 'Pink Floyd')],
      loadedIds(),
    )

    expect(merge.albums).toContainEqual(kindOfBlue)
    expect(merge.albums).toHaveLength(2)
  })

  it('does not count listenings of new albums as additions', () => {
    const merge = mergeAlbums(
      [],
      [loaded('The Wall', 'Pink Floyd', [D, E])],
      loadedIds(),
    )

    expect(merge.addedListenings).toBe(0)
    expect(merge.extendedAlbums).toBe(0)
  })
})

describe('isLoadableAlbum', () => {
  it('rejects a blank title', () => {
    expect(isLoadableAlbum(loaded('  ', 'Pink Floyd'))).toBe(false)
  })

  it('rejects an unreadable listening', () => {
    expect(isLoadableAlbum(loaded('The Wall', '', [D, 'gestern']))).toBe(false)
  })

  it('accepts an album without artist', () => {
    expect(isLoadableAlbum(loaded('The Wall', '', [D]))).toBe(true)
  })
})
