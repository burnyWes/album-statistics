import type { AlbumOrder } from '../domain/albumOrder'

export interface AlbumOrderClient {
  readAlbumOrder(): AlbumOrder
  writeAlbumOrder(order: AlbumOrder): void
}
