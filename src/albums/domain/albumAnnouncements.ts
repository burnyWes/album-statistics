import {
  albumName,
  InvalidAlbum,
  type Album,
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

function remainingAlbumsPhrase(remainingCount: number): string {
  if (remainingCount === 0) return 'Keine Alben mehr.'
  return remainingCount === 1
    ? 'Noch 1 Album.'
    : `Noch ${remainingCount} Alben.`
}

export function albumDeletedAnnouncement(
  album: NewAlbum,
  remainingCount: number,
): string {
  return `${albumName(album)} gelöscht. ${remainingAlbumsPhrase(remainingCount)}`
}

export function deletionConsequence(album: Album): string {
  const lostListenings = album.listenings.length
  if (lostListenings === 0) return 'Es ist noch kein Hören erfasst.'
  return lostListenings === 1
    ? 'Damit geht auch 1 Mal Hören verloren.'
    : `Damit gehen auch ${lostListenings} Mal Hören verloren.`
}
