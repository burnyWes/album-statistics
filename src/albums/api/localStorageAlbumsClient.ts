import {
  deviceStorage,
  type DeviceStorage,
} from '../../shared/storage/deviceStorage'
import type { Album } from '../domain/album'
import type { AlbumsClient } from './albumsClient'

export const ALBUMS_KEY = 'albums'
export const UNREADABLE_ALBUMS_KEY = 'albums.unreadable'
export const STORAGE_VERSION = 1

type StoredAlbums = { version: typeof STORAGE_VERSION; albums: Album[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isStoredAlbum(value: unknown): value is Album {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.artist === 'string' &&
    Array.isArray(value.listenings) &&
    value.listenings.every((listening) => typeof listening === 'string')
  )
}

function isStoredAlbums(value: unknown): value is StoredAlbums {
  return (
    isRecord(value) &&
    value.version === STORAGE_VERSION &&
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

function storedText(storage: DeviceStorage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

function store(storage: DeviceStorage | null, key: string, text: string) {
  try {
    storage?.setItem(key, text)
  } catch {
    return
  }
}

function keepAside(storage: DeviceStorage | null, unreadable: string) {
  if (storedText(storage, UNREADABLE_ALBUMS_KEY) !== null) return
  store(storage, UNREADABLE_ALBUMS_KEY, unreadable)
}

function readAlbums(storage: DeviceStorage | null): readonly Album[] {
  const text = storedText(storage, ALBUMS_KEY)
  if (text === null) return []
  const content = parsed(text)
  if (isStoredAlbums(content)) return content.albums
  keepAside(storage, text)
  return []
}

function writeAlbums(storage: DeviceStorage | null, albums: readonly Album[]) {
  const content: StoredAlbums = {
    version: STORAGE_VERSION,
    albums: [...albums],
  }
  store(storage, ALBUMS_KEY, JSON.stringify(content))
}

export function createLocalStorageAlbumsClient(
  storage: DeviceStorage | null = deviceStorage(),
  createId: () => string = () => crypto.randomUUID(),
): AlbumsClient {
  return {
    readAlbums: () => readAlbums(storage),
    writeAlbums: (albums) => writeAlbums(storage, albums),
    createAlbumId: createId,
  }
}
