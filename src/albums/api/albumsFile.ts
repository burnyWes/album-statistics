import type { ExportFile } from '../../shared/files/fileExportClient'
import type { Album } from '../domain/album'
import { isLoadableAlbum, type LoadedAlbum } from '../domain/albumMerge'
import { isCover } from '../domain/cover'
import { isSpotifyLink } from '../domain/spotifyLink'

export const ALBUMS_FORMAT_VERSION = 1

type AlbumsFileContent = {
  version: typeof ALBUMS_FORMAT_VERSION
  albums: Album[]
}

export class UnreadableAlbumsFile extends Error {
  constructor() {
    super('unreadable albums file')
    this.name = 'UnreadableAlbumsFile'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

type StoredAlbum = Omit<Album, 'spotifyLink' | 'cover'> & {
  spotifyLink?: string | null
  cover?: string | null
}

type StoredAlbumsFileContent = {
  version: typeof ALBUMS_FORMAT_VERSION
  albums: StoredAlbum[]
}

function isAbsentOr(value: unknown, isPresent: (value: unknown) => boolean) {
  return value === undefined || value === null || isPresent(value)
}

function isStoredAlbum(value: unknown): value is StoredAlbum {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.artist === 'string' &&
    Array.isArray(value.listenings) &&
    value.listenings.every((listening) => typeof listening === 'string') &&
    isAbsentOr(value.spotifyLink, isSpotifyLink) &&
    isAbsentOr(value.cover, isCover)
  )
}

function albumFromStored(stored: StoredAlbum): Album {
  return {
    id: stored.id,
    title: stored.title,
    artist: stored.artist,
    spotifyLink: stored.spotifyLink ?? null,
    cover: stored.cover ?? null,
    listenings: stored.listenings,
  }
}

export function isAlbumsFileContent(
  value: unknown,
): value is StoredAlbumsFileContent {
  return (
    isRecord(value) &&
    value.version === ALBUMS_FORMAT_VERSION &&
    Array.isArray(value.albums) &&
    value.albums.every(isStoredAlbum)
  )
}

function parsed(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function albumsFileText(albums: readonly Album[]): string {
  const content: AlbumsFileContent = {
    version: ALBUMS_FORMAT_VERSION,
    albums: [...albums],
  }
  return JSON.stringify(content)
}

export function storedAlbumsFromText(text: string): Album[] | null {
  const content = parsed(text)
  return isAlbumsFileContent(content)
    ? content.albums.map(albumFromStored)
    : null
}

export function albumsFromFileText(text: string): LoadedAlbum[] {
  const content = parsed(text)
  if (!isAlbumsFileContent(content)) throw new UnreadableAlbumsFile()
  const loaded: LoadedAlbum[] = content.albums
    .map(albumFromStored)
    .map(({ title, artist, spotifyLink, cover, listenings }) => ({
      title,
      artist,
      spotifyLink,
      cover,
      listenings,
    }))
  if (!loaded.every(isLoadableAlbum)) throw new UnreadableAlbumsFile()
  return loaded
}

function localDate(today: Date): string {
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

function albumsFileName(today: Date, extension: string): string {
  return `album-statistics-${localDate(today)}.${extension}`
}

export function albumsDownloadFile(
  albums: readonly Album[],
  today: Date,
): ExportFile {
  return {
    name: albumsFileName(today, 'json'),
    mimeType: 'application/json',
    text: albumsFileText(albums),
  }
}

export function albumsShareFile(
  albums: readonly Album[],
  today: Date,
): ExportFile {
  return {
    name: albumsFileName(today, 'txt'),
    mimeType: 'text/plain',
    text: albumsFileText(albums),
  }
}
