import { describe, expect, it } from 'vitest'
import type { DeviceStorage } from '../storage/deviceStorage'
import {
  createLocalStorageAppearanceClient,
  INVERTED_BUTTONS_KEY,
  INVERTED_COLORS_KEY,
} from './localStorageAppearanceClient'

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

describe('localStorageAppearanceClient', () => {
  it('reads remembered inverted colours as inverting everything', () => {
    const { storage } = storageHolding({ [INVERTED_COLORS_KEY]: 'true' })

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readColorInversion()).toBe('everything')
  })

  it('reads remembered inverted buttons as inverting the buttons only', () => {
    const { storage } = storageHolding({ [INVERTED_BUTTONS_KEY]: 'true' })

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readColorInversion()).toBe('buttonsOnly')
  })

  it('reads both switches turned off as no inversion', () => {
    const { storage } = storageHolding({
      [INVERTED_COLORS_KEY]: 'false',
      [INVERTED_BUTTONS_KEY]: 'false',
    })

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readColorInversion()).toBe('none')
  })

  it('reads an unknown value as no inversion', () => {
    const { storage } = storageHolding({ [INVERTED_COLORS_KEY]: 'maybe' })

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readColorInversion()).toBe('none')
  })

  it('reads nothing remembered as no inversion', () => {
    const { storage } = storageHolding()

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readColorInversion()).toBe('none')
  })

  it('remembers inverting everything', () => {
    const { storage, written } = storageHolding()

    createLocalStorageAppearanceClient(storage).writeColorInversion(
      'everything',
    )

    expect(written).toEqual({
      [INVERTED_COLORS_KEY]: 'true',
      [INVERTED_BUTTONS_KEY]: 'false',
    })
  })

  it('remembers inverting the buttons only', () => {
    const { storage, written } = storageHolding()

    createLocalStorageAppearanceClient(storage).writeColorInversion(
      'buttonsOnly',
    )

    expect(written).toEqual({
      [INVERTED_COLORS_KEY]: 'false',
      [INVERTED_BUTTONS_KEY]: 'true',
    })
  })

  it('remembers no inversion', () => {
    const { storage, written } = storageHolding({
      [INVERTED_COLORS_KEY]: 'true',
    })

    createLocalStorageAppearanceClient(storage).writeColorInversion('none')

    expect(written).toEqual({
      [INVERTED_COLORS_KEY]: 'false',
      [INVERTED_BUTTONS_KEY]: 'false',
    })
  })

  it('stays usable without any storage', () => {
    const client = createLocalStorageAppearanceClient(null)

    expect(client.readColorInversion()).toBe('none')
    expect(() => client.writeColorInversion('everything')).not.toThrow()
  })

  it('stays usable while the storage refuses to be read', () => {
    const client = createLocalStorageAppearanceClient(throwingStorage)

    expect(client.readColorInversion()).toBe('none')
  })

  it('stays usable while the storage refuses to be written', () => {
    const client = createLocalStorageAppearanceClient(throwingStorage)

    expect(() => client.writeColorInversion('buttonsOnly')).not.toThrow()
  })
})
