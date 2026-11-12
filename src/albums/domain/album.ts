export type AlbumId = string

export type Listening = string

export type AlbumDraft = { title: string; artist: string }

export type NewAlbum = { title: string; artist: string }

export type Album = NewAlbum & {
  id: AlbumId
  listenings: readonly Listening[]
}

export type InvalidAlbumReason = 'titleMissing' | 'alreadyListed'

export class InvalidAlbum extends Error {
  reason: InvalidAlbumReason

  constructor(reason: InvalidAlbumReason) {
    super(reason)
    this.name = 'InvalidAlbum'
    this.reason = reason
  }
}

const collator = new Intl.Collator('de', { sensitivity: 'base', numeric: true })

function isSameAlbum(one: NewAlbum, other: NewAlbum): boolean {
  return (
    collator.compare(one.title, other.title) === 0 &&
    collator.compare(one.artist, other.artist) === 0
  )
}

export function newAlbum(
  draft: AlbumDraft,
  otherAlbums: readonly NewAlbum[],
): NewAlbum {
  const album = { title: draft.title.trim(), artist: draft.artist.trim() }
  if (album.title === '') throw new InvalidAlbum('titleMissing')
  if (otherAlbums.some((other) => isSameAlbum(album, other)))
    throw new InvalidAlbum('alreadyListed')
  return album
}

function compareByTitle(one: NewAlbum, other: NewAlbum): number {
  return (
    collator.compare(one.title, other.title) ||
    collator.compare(one.artist, other.artist)
  )
}

export function byTitle<SortedAlbum extends NewAlbum>(
  albums: readonly SortedAlbum[],
): SortedAlbum[] {
  return [...albums].sort(compareByTitle)
}

export function albumName(album: NewAlbum): string {
  return album.artist === '' ? album.title : `${album.title}, ${album.artist}`
}
