import { describe, expect, it } from 'vitest'
import type { Album } from './album'
import { listeningAt } from './listening'
import {
  listeningDurationInTotal,
  listeningDurationsOfAll,
  listeningDurationThisMonth,
} from './listeningDuration'

const now = new Date(2026, 10, 15, 12, 0)
const november = listeningAt(new Date(2026, 10, 12, 14, 20))
const october = listeningAt(new Date(2026, 9, 28, 19, 12))

function kindOfBlue(
  playingTime: number | null,
  listenings: readonly string[],
): Album {
  return {
    id: 'kind-of-blue',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    spotifyLink: null,
    cover: null,
    playingTime,
    listenings,
  }
}

describe('listening duration of an album', () => {
  const listenedFourTimes = [november, november, november, october]

  it('multiplies the listenings this month with the playing time', () => {
    expect(
      listeningDurationThisMonth(kindOfBlue(2553, listenedFourTimes), now),
    ).toBe(7659)
  })

  it('multiplies all listenings with the playing time', () => {
    expect(listeningDurationInTotal(kindOfBlue(2553, listenedFourTimes))).toBe(
      10212,
    )
  })

  it('knows no listening duration without playing time', () => {
    const album = kindOfBlue(null, listenedFourTimes)

    expect(listeningDurationThisMonth(album, now)).toBeNull()
    expect(listeningDurationInTotal(album)).toBeNull()
  })

  it('is zero for an album not listened to yet', () => {
    const album = kindOfBlue(2553, [])

    expect(listeningDurationThisMonth(album, now)).toBe(0)
    expect(listeningDurationInTotal(album)).toBe(0)
  })
})

describe('listening durations of all albums', () => {
  it('adds up the albums with playing time and counts those without', () => {
    const albums = [
      kindOfBlue(2553, [november, october]),
      { ...kindOfBlue(600, [november, november]), id: 'short' },
      { ...kindOfBlue(null, [november, november]), id: 'unknown' },
    ]

    expect(listeningDurationsOfAll(albums, now)).toEqual({
      thisMonth: 2553 + 1200,
      inTotal: 5106 + 1200,
      albumsWithoutPlayingTime: 1,
    })
  })

  it('counts an album without playing time not listened to yet', () => {
    expect(
      listeningDurationsOfAll([kindOfBlue(null, [])], now)
        .albumsWithoutPlayingTime,
    ).toBe(1)
  })

  it('is empty without albums', () => {
    expect(listeningDurationsOfAll([], now)).toEqual({
      thisMonth: 0,
      inTotal: 0,
      albumsWithoutPlayingTime: 0,
    })
  })
})
