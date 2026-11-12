import type { Album } from '../domain/album'
import type { AlbumsClient } from './albumsClient'

export type InMemoryAlbumsClient = AlbumsClient & {
  storedAlbums(): readonly Album[]
}

export function createInMemoryAlbumsClient(
  initialAlbums: readonly Album[] = [],
): InMemoryAlbumsClient {
  let albums = [...initialAlbums]
  let nextId = 1

  return {
    readAlbums: () => [...albums],
    writeAlbums: (written) => {
      albums = [...written]
    },
    createAlbumId: () => {
      const id = `album-${nextId}`
      nextId += 1
      return id
    },
    storedAlbums: () => [...albums],
  }
}
