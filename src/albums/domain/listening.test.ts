import { describe, expect, it } from 'vitest'
import type { Album } from './album'
import {
  isListening,
  lastListening,
  listeningAt,
  listeningMonthsNewestFirst,
  listeningsInTotal,
  listeningsNewestFirst,
  listeningsThisMonth,
  withListening,
  withoutListening,
} from './listening'

const now = new Date(2026, 10, 15, 12, 0)

function albumListenedAt(...moments: Date[]): Album {
  return {
    id: 'kind-of-blue',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    listenings: moments.map(listeningAt),
  }
}

describe('listening', () => {
  it('records a listening as ISO timestamp', () => {
    expect(listeningAt(now)).toBe(now.toISOString())
  })

  it('counts listenings of the current calendar month', () => {
    const album = albumListenedAt(
      new Date(2026, 10, 1, 0, 0),
      new Date(2026, 10, 30, 23, 59),
      new Date(2026, 9, 31, 23, 59),
      new Date(2025, 10, 15, 12, 0),
    )

    expect(listeningsThisMonth(album, now)).toBe(2)
  })

  it('counts all listenings in total', () => {
    const album = albumListenedAt(
      new Date(2026, 10, 1),
      new Date(2026, 9, 31),
      new Date(2025, 10, 15),
    )

    expect(listeningsInTotal(album)).toBe(3)
  })

  it('adds a listening', () => {
    const album = albumListenedAt(new Date(2026, 9, 31))

    expect(withListening(album, listeningAt(now)).listenings).toEqual([
      listeningAt(new Date(2026, 9, 31)),
      listeningAt(now),
    ])
  })

  it('removes exactly the given listening', () => {
    const earlier = new Date(2026, 9, 31)
    const album = albumListenedAt(now, earlier, now)

    expect(withoutListening(album, listeningAt(now)).listenings).toEqual([
      listeningAt(earlier),
      listeningAt(now),
    ])
  })

  it('keeps the listenings when the given one is unknown', () => {
    const album = albumListenedAt(now)

    expect(
      withoutListening(album, listeningAt(new Date(2020, 0, 1))).listenings,
    ).toEqual([listeningAt(now)])
  })
})

describe('listening history', () => {
  const earliest = new Date(2026, 10, 2, 21, 30)
  const middle = new Date(2026, 10, 10, 8, 0)
  const latest = new Date(2026, 10, 12, 14, 20)

  it('lists listenings newest first', () => {
    const album = albumListenedAt(middle, latest, earliest)

    expect(listeningsNewestFirst(album)).toEqual([
      listeningAt(latest),
      listeningAt(middle),
      listeningAt(earliest),
    ])
  })

  it('orders listenings by time, not by text', () => {
    const album: Album = {
      ...albumListenedAt(),
      listenings: ['2026-11-12T19:00:00+01:00', '2026-11-12T18:30:00.000Z'],
    }

    expect(listeningsNewestFirst(album)).toEqual([
      '2026-11-12T18:30:00.000Z',
      '2026-11-12T19:00:00+01:00',
    ])
  })

  it('keeps the album listenings untouched when sorting', () => {
    const album = albumListenedAt(middle, latest, earliest)

    listeningsNewestFirst(album)

    expect(album.listenings).toEqual(
      [middle, latest, earliest].map(listeningAt),
    )
  })

  it('finds the last listening', () => {
    expect(lastListening(albumListenedAt(middle, latest, earliest))).toBe(
      listeningAt(latest),
    )
  })

  it('has no last listening without listenings', () => {
    expect(lastListening(albumListenedAt())).toBeNull()
  })
})

describe('listening months', () => {
  it('groups listenings by month, newest month and listening first', () => {
    const album = albumListenedAt(
      new Date(2026, 9, 28, 19, 12),
      new Date(2026, 10, 2, 21, 30),
      new Date(2025, 11, 31, 23, 59),
      new Date(2026, 10, 12, 14, 20),
    )

    expect(listeningMonthsNewestFirst(album)).toEqual([
      {
        year: 2026,
        monthIndex: 10,
        listenings: [
          listeningAt(new Date(2026, 10, 12, 14, 20)),
          listeningAt(new Date(2026, 10, 2, 21, 30)),
        ],
      },
      {
        year: 2026,
        monthIndex: 9,
        listenings: [listeningAt(new Date(2026, 9, 28, 19, 12))],
      },
      {
        year: 2025,
        monthIndex: 11,
        listenings: [listeningAt(new Date(2025, 11, 31, 23, 59))],
      },
    ])
  })

  it('leaves out months without listenings', () => {
    const album = albumListenedAt(
      new Date(2026, 10, 1, 0, 0),
      new Date(2026, 7, 31, 23, 59),
    )

    expect(
      listeningMonthsNewestFirst(album).map(({ monthIndex }) => monthIndex),
    ).toEqual([10, 7])
  })

  it('has no months without listenings', () => {
    expect(listeningMonthsNewestFirst(albumListenedAt())).toEqual([])
  })
})

describe('isListening', () => {
  it('accepts a readable timestamp', () => {
    expect(isListening('2026-11-12T18:04:00.000Z')).toBe(true)
    expect(isListening('2026-11-12T19:00:00+01:00')).toBe(true)
  })

  it('rejects an unreadable timestamp', () => {
    expect(isListening('gestern')).toBe(false)
    expect(isListening('')).toBe(false)
  })
})
