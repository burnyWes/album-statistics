export type SpotifyLink = string

export type ParsedSpotifyLink =
  { valid: true; link: SpotifyLink | null } | { valid: false }

const HAS_SCHEME_WITH_AUTHORITY = /^[a-z][a-z0-9+.-]*:\/\//i
const HAS_SCHEME_WITHOUT_AUTHORITY =
  /^(javascript|data|vbscript|mailto|tel|file|spotify):/i
const WEB_PROTOCOLS = ['http:', 'https:']
const SPOTIFY_HOSTS = ['open.spotify.com', 'spotify.link']

function withAssumedScheme(address: string): string {
  const hasScheme =
    HAS_SCHEME_WITH_AUTHORITY.test(address) ||
    HAS_SCHEME_WITHOUT_AUTHORITY.test(address)
  return hasScheme ? address : `https://${address}`
}

function urlOf(address: string): URL | null {
  try {
    return new URL(address)
  } catch {
    return null
  }
}

function isSpotifyAddress(url: URL): boolean {
  return (
    WEB_PROTOCOLS.includes(url.protocol) && SPOTIFY_HOSTS.includes(url.hostname)
  )
}

export function parseSpotifyLink(raw: string): ParsedSpotifyLink {
  const address = raw.trim()
  if (address === '') return { valid: true, link: null }
  const url = urlOf(withAssumedScheme(address))
  if (url === null || !isSpotifyAddress(url)) return { valid: false }
  return { valid: true, link: url.href }
}

export function isSpotifyLink(value: unknown): value is SpotifyLink {
  if (typeof value !== 'string') return false
  const parsed = parseSpotifyLink(value)
  return parsed.valid && parsed.link === value
}
