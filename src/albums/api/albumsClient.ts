import type { Album, AlbumId } from '../domain/album'

export interface AlbumsClient {
  readAlbums(): readonly Album[]
  writeAlbums(albums: readonly Album[]): void
  createAlbumId(): AlbumId
}
