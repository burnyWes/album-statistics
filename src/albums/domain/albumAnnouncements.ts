import {
  albumName,
  InvalidAlbum,
  type InvalidAlbumReason,
  type NewAlbum,
} from './album'

const messagesByReason: Record<InvalidAlbumReason, string> = {
  titleMissing: 'Bitte einen Albumnamen eingeben.',
  alreadyListed: 'Dieses Album gibt es schon.',
}

export function albumFailureMessage(error: unknown): string | null {
  if (error instanceof InvalidAlbum) return messagesByReason[error.reason]
  return null
}

export function albumsHeading(albumCount: number): string {
  return albumCount === 0 ? 'Alben' : `Alben, ${albumCount}`
}

export function albumSavedAnnouncement(album: NewAlbum): string {
  return `${albumName(album)} gespeichert.`
}
