import { describe, expect, it } from 'vitest'
import type { DeviceStorage } from '../../shared/storage/deviceStorage'
import type { Album } from '../domain/album'
import { AlbumsStorageFull } from './albumsClient'
import {
  ALBUMS_KEY,
  createLocalStorageAlbumsClient,
  UNREADABLE_ALBUMS_KEY,
} from './localStorageAlbumsClient'

const kindOfBlue: Album = {
  id: 'kind-of-blue',
  title: 'Kind of Blue',
  artist: 'Miles Davis',
  spotifyLink: null,
  cover: null,
  listenings: ['2026-11-12T18:04:00.000Z'],
}

function storageHolding(entries: Record<string, string> = {}) {
  const stored = new Map(Object.entries(entries))
  const storage: DeviceStorage = {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => {
      stored.set(key, value)
    },
  }
  return { storage, stored }
}

const throwingStorage: DeviceStorage = {
  getItem() {
    throw new Error('storage is blocked')
  },
  setItem() {
    throw new Error('storage is blocked')
  },
}

function fullStorage(errorName: string): DeviceStorage {
  return {
    getItem: () => null,
    setItem() {
      throw new DOMException('quota exceeded', errorName)
    },
  }
}

describe('localStorageAlbumsClient', () => {
  it('reads no albums from empty storage', () => {
    const { storage } = storageHolding()

    expect(createLocalStorageAlbumsClient(storage).readAlbums()).toEqual([])
  })

  it('writes and reads albums with version 1', () => {
    const { storage, stored } = storageHolding()

    createLocalStorageAlbumsClient(storage).writeAlbums([kindOfBlue])

    expect(JSON.parse(stored.get(ALBUMS_KEY)!)).toEqual({
      version: 1,
      albums: [kindOfBlue],
    })
    expect(createLocalStorageAlbumsClient(storage).readAlbums()).toEqual([
      kindOfBlue,
    ])
  })

  it('keeps unreadable data aside and starts empty', () => {
    const { storage, stored } = storageHolding({ [ALBUMS_KEY]: '{kaputt' })

    expect(createLocalStorageAlbumsClient(storage).readAlbums()).toEqual([])
    expect(stored.get(UNREADABLE_ALBUMS_KEY)).toBe('{kaputt')
  })

  it('keeps data of an unknown version aside', () => {
    const unknownVersion = JSON.stringify({ version: 2, albums: [] })
    const { storage, stored } = storageHolding({ [ALBUMS_KEY]: unknownVersion })

    expect(createLocalStorageAlbumsClient(storage).readAlbums()).toEqual([])
    expect(stored.get(UNREADABLE_ALBUMS_KEY)).toBe(unknownVersion)
  })

  it('keeps data of an unexpected shape aside', () => {
    const withoutListenings = JSON.stringify({
      version: 1,
      albums: [{ id: 'a', title: 'A', artist: '' }],
    })
    const { storage, stored } = storageHolding({
      [ALBUMS_KEY]: withoutListenings,
    })

    expect(createLocalStorageAlbumsClient(storage).readAlbums()).toEqual([])
    expect(stored.get(UNREADABLE_ALBUMS_KEY)).toBe(withoutListenings)
  })

  it('does not overwrite data already kept aside', () => {
    const { storage, stored } = storageHolding({
      [ALBUMS_KEY]: '{kaputt',
      [UNREADABLE_ALBUMS_KEY]: 'kept earlier',
    })

    createLocalStorageAlbumsClient(storage).readAlbums()

    expect(stored.get(UNREADABLE_ALBUMS_KEY)).toBe('kept earlier')
  })

  it('starts empty when storage is blocked', () => {
    expect(
      createLocalStorageAlbumsClient(throwingStorage).readAlbums(),
    ).toEqual([])
    expect(createLocalStorageAlbumsClient(null).readAlbums()).toEqual([])
  })

  it('ignores writes when storage is blocked', () => {
    expect(() =>
      createLocalStorageAlbumsClient(throwingStorage).writeAlbums([kindOfBlue]),
    ).not.toThrow()
    expect(() =>
      createLocalStorageAlbumsClient(null).writeAlbums([kindOfBlue]),
    ).not.toThrow()
  })

  it.each(['QuotaExceededError', 'NS_ERROR_DOM_QUOTA_REACHED'])(
    'tells that the storage is full on %s',
    (errorName) => {
      expect(() =>
        createLocalStorageAlbumsClient(fullStorage(errorName)).writeAlbums([
          kindOfBlue,
        ]),
      ).toThrow(AlbumsStorageFull)
    },
  )

  it('keeps unreadable data aside silently even when the storage is full', () => {
    const storage: DeviceStorage = {
      getItem: (key) => (key === ALBUMS_KEY ? '{kaputt' : null),
      setItem() {
        throw new DOMException('quota exceeded', 'QuotaExceededError')
      },
    }

    expect(createLocalStorageAlbumsClient(storage).readAlbums()).toEqual([])
  })

  it('creates distinct album ids', () => {
    const client = createLocalStorageAlbumsClient(storageHolding().storage)

    expect(client.createAlbumId()).not.toBe(client.createAlbumId())
  })
})
