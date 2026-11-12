import type { Album, AlbumId } from '../domain/album'

export class AlbumsStorageFull extends Error {
  constructor() {
    super('albums storage full')
    this.name = 'AlbumsStorageFull'
  }
}

export interface AlbumsClient {
  readAlbums(): readonly Album[]
  writeAlbums(albums: readonly Album[]): void
  createAlbumId(): AlbumId
}
