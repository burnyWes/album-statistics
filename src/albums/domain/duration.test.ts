import { describe, expect, it } from 'vitest'
import { clockDuration, spokenDuration } from './duration'

describe('clockDuration', () => {
  it.each([
    [0, '0:00:00'],
    [59, '0:00:59'],
    [2553, '0:42:33'],
    [7659, '2:07:39'],
    [445510, '123:45:10'],
  ])('shows %i seconds as %s', (seconds, shown) => {
    expect(clockDuration(seconds)).toBe(shown)
  })
})

describe('spokenDuration', () => {
  it.each([
    [7659, '2 Stunden, 7 Minuten, 39 Sekunden'],
    [2553, '42 Minuten, 33 Sekunden'],
    [3661, '1 Stunde, 1 Minute, 1 Sekunde'],
    [3600, '1 Stunde'],
    [0, '0 Sekunden'],
  ])('speaks %i seconds as %s', (seconds, spoken) => {
    expect(spokenDuration(seconds)).toBe(spoken)
  })
})
