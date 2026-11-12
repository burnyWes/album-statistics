import {
  albumName,
  InvalidAlbum,
  type Album,
  type InvalidAlbumReason,
  type Listening,
  type NamedAlbum,
} from './album'
import type { AlbumsMerge } from './albumMerge'
import { listeningsInTotal, listeningsThisMonth } from './listening'
import { spokenListeningTime } from './listeningTime'

const messagesByReason: Record<InvalidAlbumReason, string> = {
  titleMissing: 'Bitte einen Albumnamen eingeben.',
  spotifyLinkInvalid: 'Das ist kein Spotify-Link.',
  alreadyListed: 'Dieses Album gibt es schon.',
}

export function albumFailureMessage(error: unknown): string | null {
  if (error instanceof InvalidAlbum) return messagesByReason[error.reason]
  return null
}

export function albumsHeading(albumCount: number): string {
  return albumCount === 0 ? 'Alben' : `Alben, ${albumCount}`
}

export function albumSavedAnnouncement(album: NamedAlbum): string {
  return `${albumName(album)} gespeichert.`
}

function remainingAlbumsPhrase(remainingCount: number): string {
  if (remainingCount === 0) return 'Keine Alben mehr.'
  return remainingCount === 1
    ? 'Noch 1 Album.'
    : `Noch ${remainingCount} Alben.`
}

export function albumDeletedAnnouncement(
  album: NamedAlbum,
  remainingCount: number,
): string {
  return `${albumName(album)} gelöscht. ${remainingAlbumsPhrase(remainingCount)}`
}

export function deletionConsequence(album: Album): string {
  const lostListenings = listeningsInTotal(album)
  if (lostListenings === 0) return 'Es ist noch kein Hören erfasst.'
  return lostListenings === 1
    ? 'Damit geht auch 1 Mal Hören verloren.'
    : `Damit gehen auch ${lostListenings} Mal Hören verloren.`
}

export function albumRowLabel(album: Album, now: Date): string {
  return `${albumName(album)}. Diesen Monat ${listeningsThisMonth(album, now)} Mal, insgesamt ${listeningsInTotal(album)} Mal gehört.`
}

export function listenedButtonLabel(album: NamedAlbum): string {
  return `${albumName(album)} gehört`
}

function bothCounts(album: Album, now: Date): string {
  return `Diesen Monat ${listeningsThisMonth(album, now)}, insgesamt ${listeningsInTotal(album)}.`
}

export function listenedAnnouncement(album: Album, now: Date): string {
  return `${albumName(album)} gehört. ${bothCounts(album, now)}`
}

export function listeningTakenBackAnnouncement(
  album: Album,
  now: Date,
): string {
  return `${albumName(album)}: Hören zurückgenommen. ${bothCounts(album, now)}`
}

export function undoListeningLabel(album: NamedAlbum): string {
  return `Rückgängig: ${albumName(album)}`
}

export function listeningsHeading(album: Album): string {
  const count = listeningsInTotal(album)
  return count === 0 ? 'Gehört' : `Gehört, ${count} Mal`
}

function listeningPhrase(listening: Listening): string {
  return `Hören vom ${spokenListeningTime(listening)}`
}

export function deleteListeningLabel(listening: Listening): string {
  return `${listeningPhrase(listening)} löschen`
}

export function deleteListeningQuestion(listening: Listening): string {
  return `${listeningPhrase(listening)} löschen?`
}

export function listeningDeletedAnnouncement(
  albumAfterDeleting: Album,
  listening: Listening,
  now: Date,
): string {
  return `${listeningPhrase(listening)} gelöscht. ${bothCounts(albumAfterDeleting, now)}`
}

export function albumsSavedAnnouncement(fileName: string): string {
  return `Daten gespeichert als ${fileName}.`
}

function albumCountPhrase(count: number): string {
  return count === 1 ? '1 Album' : `${count} Alben`
}

export function albumsLoadedAnnouncement(merge: AlbumsMerge): string {
  const changes = [
    ...(merge.addedAlbums > 0
      ? [`${albumCountPhrase(merge.addedAlbums)} neu`]
      : []),
    ...(merge.extendedAlbums > 0
      ? [`${albumCountPhrase(merge.extendedAlbums)} ergänzt`]
      : []),
  ]
  if (changes.length === 0) return 'Daten geladen. Es war nichts Neues dabei.'
  return `Daten geladen. ${changes.join(', ')}.`
}

export const unreadableAlbumsFileMessage =
  'Diese Datei enthält keine lesbaren Album-Daten. Es wurde nichts geändert.'

export type ShareResult = 'shared' | 'dismissed' | 'failed'

const announcementsByShareResult: Record<ShareResult, string> = {
  shared: 'Daten geteilt.',
  dismissed: 'Teilen abgebrochen.',
  failed: 'Teilen hat nicht geklappt.',
}

export function shareAnnouncement(result: ShareResult): string {
  return announcementsByShareResult[result]
}

export const storageFullMessage =
  'Der Speicher ist voll. Es wurde nichts geändert.'

export const unreadableCoverMessage = 'Dieses Bild konnte nicht gelesen werden.'

export const coverChosenAnnouncement = 'Cover gewählt.'

export const coverRemovedAnnouncement = 'Cover entfernt.'
