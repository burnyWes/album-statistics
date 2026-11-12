import { describe, expect, it } from 'vitest'
import type { DeviceStorage } from '../../shared/storage/deviceStorage'
import { DEFAULT_ALBUM_ORDER } from '../domain/albumOrder'
import {
  ALBUM_ORDER_KEY,
  createLocalStorageAlbumOrderClient,
} from './localStorageAlbumOrderClient'

function storageHolding(stored: Record<string, string> = {}) {
  const written: Record<string, string> = {}
  const storage: DeviceStorage = {
    getItem: (key) => stored[key] ?? null,
    setItem: (key, value) => {
      written[key] = value
    },
  }
  return { storage, written }
}

const throwingStorage: DeviceStorage = {
  getItem() {
    throw new Error('storage is blocked')
  },
  setItem() {
    throw new Error('storage is blocked')
  },
}

describe('localStorageAlbumOrderClient', () => {
  it('reads a remembered order', () => {
    const { storage } = storageHolding({ [ALBUM_ORDER_KEY]: 'inTotal' })

    const client = createLocalStorageAlbumOrderClient(storage)

    expect(client.readAlbumOrder()).toBe('inTotal')
  })

  it('reads nothing remembered as the default order', () => {
    const { storage } = storageHolding()

    const client = createLocalStorageAlbumOrderClient(storage)

    expect(client.readAlbumOrder()).toBe(DEFAULT_ALBUM_ORDER)
  })

  it('reads an unknown order as the default order', () => {
    const { storage } = storageHolding({ [ALBUM_ORDER_KEY]: 'byTitle' })

    const client = createLocalStorageAlbumOrderClient(storage)

    expect(client.readAlbumOrder()).toBe(DEFAULT_ALBUM_ORDER)
  })

  it('remembers the order', () => {
    const { storage, written } = storageHolding()

    createLocalStorageAlbumOrderClient(storage).writeAlbumOrder('thisMonth')

    expect(written).toEqual({ [ALBUM_ORDER_KEY]: 'thisMonth' })
  })

  it('stays usable without any storage', () => {
    const client = createLocalStorageAlbumOrderClient(null)

    expect(client.readAlbumOrder()).toBe(DEFAULT_ALBUM_ORDER)
    expect(() => client.writeAlbumOrder('inTotal')).not.toThrow()
  })

  it('stays usable while the storage refuses to be read', () => {
    const client = createLocalStorageAlbumOrderClient(throwingStorage)

    expect(client.readAlbumOrder()).toBe(DEFAULT_ALBUM_ORDER)
  })

  it('stays usable while the storage refuses to be written', () => {
    const client = createLocalStorageAlbumOrderClient(throwingStorage)

    expect(() => client.writeAlbumOrder('inTotal')).not.toThrow()
  })
})
