export type AlbumId = string

export type Album = {
  id: AlbumId
  title: string
  artist: string
}

export type NewAlbum = Omit<Album, 'id'>

export type InvalidAlbumReason = 'titleMissing' | 'artistMissing'

export class InvalidAlbum extends Error {
  reason: InvalidAlbumReason

  constructor(reason: InvalidAlbumReason) {
    super(reason)
    this.name = 'InvalidAlbum'
    this.reason = reason
  }
}

export function newAlbum(title: string, artist: string): NewAlbum {
  const trimmedTitle = title.trim()
  const trimmedArtist = artist.trim()
  if (trimmedTitle === '') throw new InvalidAlbum('titleMissing')
  if (trimmedArtist === '') throw new InvalidAlbum('artistMissing')
  return { title: trimmedTitle, artist: trimmedArtist }
}
