import { describe, expect, it } from 'vitest'
import { listeningAt } from './listening'
import {
  listeningMonthName,
  shortListeningTime,
  spokenListeningTime,
} from './listeningTime'

describe('listening time', () => {
  it('formats a listening short with weekday in local time', () => {
    expect(
      shortListeningTime(listeningAt(new Date(2026, 10, 12, 14, 20))),
    ).toBe('Do., 12.11.2026, 14:20')
  })

  it('pads day, month, hour and minute', () => {
    expect(shortListeningTime(listeningAt(new Date(2026, 0, 4, 9, 5)))).toBe(
      'So., 04.01.2026, 09:05',
    )
  })

  it('formats a listening for reading aloud with the full weekday', () => {
    expect(
      spokenListeningTime(listeningAt(new Date(2026, 10, 12, 14, 20))),
    ).toBe('Donnerstag, 12.11.2026, 14:20')
  })
})

describe('listening month name', () => {
  it('names month and year', () => {
    expect(
      listeningMonthName({ year: 2026, monthIndex: 10, listenings: [] }),
    ).toBe('November 2026')
  })

  it('names January', () => {
    expect(
      listeningMonthName({ year: 2027, monthIndex: 0, listenings: [] }),
    ).toBe('Januar 2027')
  })
})
