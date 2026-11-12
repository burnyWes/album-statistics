import {
  deviceStorage,
  type DeviceStorage,
} from '../../shared/storage/deviceStorage'
import {
  DEFAULT_ALBUM_ORDER,
  isAlbumOrder,
  type AlbumOrder,
} from '../domain/albumOrder'
import type { AlbumOrderClient } from './albumOrderClient'

export const ALBUM_ORDER_KEY = 'albumOrder'

function rememberedOrder(storage: DeviceStorage | null): AlbumOrder {
  try {
    const stored = storage?.getItem(ALBUM_ORDER_KEY) ?? null
    return stored !== null && isAlbumOrder(stored)
      ? stored
      : DEFAULT_ALBUM_ORDER
  } catch {
    return DEFAULT_ALBUM_ORDER
  }
}

function remember(storage: DeviceStorage | null, order: AlbumOrder): void {
  try {
    storage?.setItem(ALBUM_ORDER_KEY, order)
  } catch {
    return
  }
}

export function createLocalStorageAlbumOrderClient(
  storage: DeviceStorage | null = deviceStorage(),
): AlbumOrderClient {
  return {
    readAlbumOrder: () => rememberedOrder(storage),
    writeAlbumOrder: (order) => remember(storage, order),
  }
}
