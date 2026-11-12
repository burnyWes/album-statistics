import type { Album } from '../domain/album'
import { AlbumsStorageFull, type AlbumsClient } from './albumsClient'

export type InMemoryAlbumsClient = AlbumsClient & {
  storedAlbums(): readonly Album[]
  storageFull(): void
}

export function createInMemoryAlbumsClient(
  initialAlbums: readonly Album[] = [],
): InMemoryAlbumsClient {
  let albums = [...initialAlbums]
  let nextId = 1
  let full = false

  return {
    readAlbums: () => [...albums],
    writeAlbums: (written) => {
      if (full) throw new AlbumsStorageFull()
      albums = [...written]
    },
    createAlbumId: () => {
      const id = `album-${nextId}`
      nextId += 1
      return id
    },
    storedAlbums: () => [...albums],
    storageFull: () => {
      full = true
    },
  }
}
