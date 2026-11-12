import { describe, expect, it } from 'vitest'
import type { Album } from './album'
import {
  listeningAt,
  listeningsInTotal,
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
