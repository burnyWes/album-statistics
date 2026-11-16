import { describe, expect, it } from 'vitest'
import {
  isPlayingTime,
  parsePlayingTime,
  playingTimeInput,
} from './playingTime'

function secondsOf(raw: string) {
  const parsed = parsePlayingTime(raw)
  return parsed.valid ? parsed.playingTime : 'invalid'
}

describe('parsePlayingTime', () => {
  it.each(['', '   '])('treats %j as no playing time', (raw) => {
    expect(parsePlayingTime(raw)).toEqual({ valid: true, playingTime: null })
  })

  it.each([
    ['42', 2520],
    [' 42:33 ', 2553],
    ['5:7', 307],
    ['5:07', 307],
    ['95', 5700],
    ['0:30', 30],
  ])('reads %j as %i seconds', (raw, seconds) => {
    expect(secondsOf(raw)).toBe(seconds)
  })

  it.each([
    '0',
    '0:00',
    '42:60',
    '42:75',
    '42,5',
    '1:20:33',
    '-3',
    'abc',
    '42:',
    ':33',
    '42:333',
  ])('rejects %j', (raw) => {
    expect(parsePlayingTime(raw)).toEqual({ valid: false })
  })
})

describe('isPlayingTime', () => {
  it('accepts a positive whole number of seconds', () => {
    expect(isPlayingTime(2553)).toBe(true)
  })

  it.each([0, -1, 2.5, '2553', null, NaN])('rejects %j', (value) => {
    expect(isPlayingTime(value)).toBe(false)
  })
})

describe('playingTimeInput', () => {
  it.each([
    [null, ''],
    [2520, '42'],
    [2553, '42:33'],
    [307, '5:07'],
  ])('writes %j as %j', (playingTime, input) => {
    expect(playingTimeInput(playingTime)).toBe(input)
  })
})
