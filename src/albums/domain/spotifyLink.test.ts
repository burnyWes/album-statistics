import { describe, expect, it } from 'vitest'
import { isSpotifyLink, parseSpotifyLink } from './spotifyLink'

function linkOf(raw: string) {
  const parsed = parseSpotifyLink(raw)
  return parsed.valid ? parsed.link : 'invalid'
}

describe('parseSpotifyLink', () => {
  it.each(['', '   '])('treats %j as no link', (raw) => {
    expect(parseSpotifyLink(raw)).toEqual({ valid: true, link: null })
  })

  it('adds https to an address without scheme', () => {
    expect(linkOf(' open.spotify.com/album/x ')).toBe(
      'https://open.spotify.com/album/x',
    )
  })

  it('keeps the query', () => {
    expect(linkOf('https://open.spotify.com/album/x?si=abc')).toBe(
      'https://open.spotify.com/album/x?si=abc',
    )
  })

  it('writes the host in lower case', () => {
    expect(linkOf('HTTPS://OPEN.SPOTIFY.COM/album/x')).toBe(
      'https://open.spotify.com/album/x',
    )
  })

  it('accepts a shortened spotify link', () => {
    expect(linkOf('https://spotify.link/AbC')).toBe('https://spotify.link/AbC')
  })

  it.each([
    'javascript:alert(1)',
    'spotify:album:x',
    'ftp://open.spotify.com/x',
    'https://example.com',
    'https://open.spotify.com.evil.de/x',
    'foo',
    'https://',
  ])('rejects %j', (raw) => {
    expect(parseSpotifyLink(raw)).toEqual({ valid: false })
  })
})

describe('isSpotifyLink', () => {
  it('accepts a normalised link', () => {
    expect(isSpotifyLink('https://open.spotify.com/album/x')).toBe(true)
  })

  it('rejects a link that is not normalised', () => {
    expect(isSpotifyLink('open.spotify.com/album/x')).toBe(false)
    expect(isSpotifyLink('HTTPS://OPEN.SPOTIFY.COM/album/x')).toBe(false)
  })

  it('rejects foreign addresses and other values', () => {
    expect(isSpotifyLink('https://example.com/')).toBe(false)
    expect(isSpotifyLink('')).toBe(false)
    expect(isSpotifyLink(42)).toBe(false)
  })
})
