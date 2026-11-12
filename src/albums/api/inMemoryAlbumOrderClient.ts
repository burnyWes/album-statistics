import { DEFAULT_ALBUM_ORDER, type AlbumOrder } from '../domain/albumOrder'
import type { AlbumOrderClient } from './albumOrderClient'

export type InMemoryAlbumOrderClient = AlbumOrderClient & {
  storedAlbumOrder(): AlbumOrder
}

export function createInMemoryAlbumOrderClient(
  order: AlbumOrder = DEFAULT_ALBUM_ORDER,
): InMemoryAlbumOrderClient {
  let storedAlbumOrder = order

  return {
    readAlbumOrder: () => storedAlbumOrder,
    writeAlbumOrder: (wanted) => {
      storedAlbumOrder = wanted
    },
    storedAlbumOrder: () => storedAlbumOrder,
  }
}
