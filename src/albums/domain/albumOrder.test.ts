import { describe, expect, it } from 'vitest'
import { byTitle, type Album } from './album'
import { inOrder, isAlbumOrder } from './albumOrder'
import { listeningAt } from './listening'

const now = new Date(2026, 10, 15, 12, 0)

const thisMonth = listeningAt(new Date(2026, 10, 2, 20, 0))
const lastMonth = listeningAt(new Date(2026, 9, 28, 19, 12))
const sameMonthLastYear = listeningAt(new Date(2025, 10, 10, 9, 0))

function album(
  title: string,
  artist: string,
  listenings: readonly string[] = [],
): Album {
  return {
    id: `${title}-${artist}`,
    title,
    artist,
    spotifyLink: null,
    cover: null,
    listenings,
  }
}

function names(albums: readonly Album[]): string[] {
  return albums.map((listed) => `${listed.title}/${listed.artist}`)
}

describe('inOrder', () => {
  it('orders alphabetically like byTitle', () => {
    const albums = [
      album('The Wall', 'Pink Floyd', [thisMonth]),
      album('Kind of Blue', 'Miles Davis'),
      album('Greatest Hits', 'Queen'),
      album('Greatest Hits', 'ABBA'),
    ]

    expect(inOrder(albums, 'alphabetical', now)).toEqual(byTitle(albums))
  })

  it('orders by listenings in the month of now, most first', () => {
    const albums = [
      album('Abbey Road', 'The Beatles', [lastMonth, lastMonth, lastMonth]),
      album('Kind of Blue', 'Miles Davis', [thisMonth]),
      album('The Wall', 'Pink Floyd', [thisMonth, thisMonth]),
      album('Revolver', 'The Beatles', [sameMonthLastYear, sameMonthLastYear]),
    ]

    expect(names(inOrder(albums, 'thisMonth', now))).toEqual([
      'The Wall/Pink Floyd',
      'Kind of Blue/Miles Davis',
      'Abbey Road/The Beatles',
      'Revolver/The Beatles',
    ])
  })

  it('orders equal listenings this month alphabetically, then by artist', () => {
    const albums = [
      album('The Wall', 'Pink Floyd'),
      album('Greatest Hits', 'Queen', [thisMonth]),
      album('Abbey Road', 'The Beatles'),
      album('Greatest Hits', 'ABBA', [thisMonth]),
    ]

    expect(names(inOrder(albums, 'thisMonth', now))).toEqual([
      'Greatest Hits/ABBA',
      'Greatest Hits/Queen',
      'Abbey Road/The Beatles',
      'The Wall/Pink Floyd',
    ])
  })

  it('orders by listenings in total, most first, equal ones alphabetically', () => {
    const albums = [
      album('The Wall', 'Pink Floyd', [thisMonth]),
      album('Kind of Blue', 'Miles Davis', [lastMonth, sameMonthLastYear]),
      album('Abbey Road', 'The Beatles', [thisMonth]),
      album('Revolver', 'The Beatles'),
    ]

    expect(names(inOrder(albums, 'inTotal', now))).toEqual([
      'Kind of Blue/Miles Davis',
      'Abbey Road/The Beatles',
      'The Wall/Pink Floyd',
      'Revolver/The Beatles',
    ])
  })

  it('leaves the given albums unchanged', () => {
    const albums = [
      album('The Wall', 'Pink Floyd'),
      album('Kind of Blue', 'Miles Davis', [thisMonth]),
    ]
    const before = [...albums]

    inOrder(albums, 'thisMonth', now)
    inOrder(albums, 'inTotal', now)
    inOrder(albums, 'alphabetical', now)

    expect(albums).toEqual(before)
  })
})

describe('isAlbumOrder', () => {
  it('accepts the three orders', () => {
    expect(isAlbumOrder('alphabetical')).toBe(true)
    expect(isAlbumOrder('thisMonth')).toBe(true)
    expect(isAlbumOrder('inTotal')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isAlbumOrder('')).toBe(false)
    expect(isAlbumOrder('byTitle')).toBe(false)
    expect(isAlbumOrder('INTOTAL')).toBe(false)
  })
})
