import {
  deviceStorage,
  type DeviceStorage,
} from '../../shared/storage/deviceStorage'
import type { Album } from '../domain/album'
import type { AlbumsClient } from './albumsClient'
import { albumsFileText, storedAlbumsFromText } from './albumsFile'

export const ALBUMS_KEY = 'albums'
export const UNREADABLE_ALBUMS_KEY = 'albums.unreadable'

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
  const albums = storedAlbumsFromText(text)
  if (albums !== null) return albums
  keepAside(storage, text)
  return []
}

function writeAlbums(storage: DeviceStorage | null, albums: readonly Album[]) {
  store(storage, ALBUMS_KEY, albumsFileText(albums))
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
