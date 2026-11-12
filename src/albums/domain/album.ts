import type { Cover } from './cover'
import { parseSpotifyLink, type SpotifyLink } from './spotifyLink'

export type AlbumId = string

export type Listening = string

export type AlbumDraft = {
  title: string
  artist: string
  spotifyLink: string
  cover: Cover | null
}

export type NamedAlbum = { title: string; artist: string }

export type NewAlbum = NamedAlbum & {
  spotifyLink: SpotifyLink | null
  cover: Cover | null
}

export type Album = NewAlbum & {
  id: AlbumId
  listenings: readonly Listening[]
}

export type InvalidAlbumReason =
  'titleMissing' | 'spotifyLinkInvalid' | 'alreadyListed'

export class InvalidAlbum extends Error {
  reason: InvalidAlbumReason

  constructor(reason: InvalidAlbumReason) {
    super(reason)
    this.name = 'InvalidAlbum'
    this.reason = reason
  }
}

const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true })

export function isSameAlbum(one: NamedAlbum, other: NamedAlbum): boolean {
  return (
    collator.compare(one.title, other.title) === 0 &&
    collator.compare(one.artist, other.artist) === 0
  )
}

export function newAlbum(
  draft: AlbumDraft,
  otherAlbums: readonly NamedAlbum[],
): NewAlbum {
  const name = { title: draft.title.trim(), artist: draft.artist.trim() }
  if (name.title === '') throw new InvalidAlbum('titleMissing')
  const spotifyLink = parseSpotifyLink(draft.spotifyLink)
  if (!spotifyLink.valid) throw new InvalidAlbum('spotifyLinkInvalid')
  if (otherAlbums.some((other) => isSameAlbum(name, other)))
    throw new InvalidAlbum('alreadyListed')
  return { ...name, spotifyLink: spotifyLink.link, cover: draft.cover }
}

export function compareByTitle(one: NamedAlbum, other: NamedAlbum): number {
  return (
    collator.compare(one.title, other.title) ||
    collator.compare(one.artist, other.artist)
  )
}

export function byTitle<SortedAlbum extends NamedAlbum>(
  albums: readonly SortedAlbum[],
): SortedAlbum[] {
  return [...albums].sort(compareByTitle)
}

export function albumName(album: NamedAlbum): string {
  return album.artist === '' ? album.title : `${album.title}, ${album.artist}`
}
