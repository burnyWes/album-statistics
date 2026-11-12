import { describe, expect, it } from 'vitest'
import type { DeviceStorage } from '../storage/deviceStorage'
import { NO_COLOR_INVERSION } from './appearanceClient'
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
  it('reads both remembered switches independently', () => {
    const { storage } = storageHolding({
      [INVERTED_COLORS_KEY]: 'true',
      [INVERTED_BUTTONS_KEY]: 'true',
    })

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readColorInversion()).toEqual({
      invertedColors: true,
      invertedButtons: true,
    })
  })

  it('reads remembered inverted buttons on a light page', () => {
    const { storage } = storageHolding({
      [INVERTED_COLORS_KEY]: 'false',
      [INVERTED_BUTTONS_KEY]: 'true',
    })

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readColorInversion()).toEqual({
      invertedColors: false,
      invertedButtons: true,
    })
  })

  it('reads an unknown value as turned off', () => {
    const { storage } = storageHolding({ [INVERTED_COLORS_KEY]: 'maybe' })

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readColorInversion()).toEqual(NO_COLOR_INVERSION)
  })

  it('reads nothing remembered as turned off', () => {
    const { storage } = storageHolding()

    const client = createLocalStorageAppearanceClient(storage)

    expect(client.readColorInversion()).toEqual(NO_COLOR_INVERSION)
  })

  it('remembers both switches', () => {
    const { storage, written } = storageHolding()

    createLocalStorageAppearanceClient(storage).writeColorInversion({
      invertedColors: true,
      invertedButtons: false,
    })

    expect(written).toEqual({
      [INVERTED_COLORS_KEY]: 'true',
      [INVERTED_BUTTONS_KEY]: 'false',
    })
  })

  it('stays usable without any storage', () => {
    const client = createLocalStorageAppearanceClient(null)

    expect(client.readColorInversion()).toEqual(NO_COLOR_INVERSION)
    expect(() =>
      client.writeColorInversion({
        invertedColors: true,
        invertedButtons: true,
      }),
    ).not.toThrow()
  })

  it('stays usable while the storage refuses to be read', () => {
    const client = createLocalStorageAppearanceClient(throwingStorage)

    expect(client.readColorInversion()).toEqual(NO_COLOR_INVERSION)
  })

  it('stays usable while the storage refuses to be written', () => {
    const client = createLocalStorageAppearanceClient(throwingStorage)

    expect(() =>
      client.writeColorInversion({
        invertedColors: true,
        invertedButtons: true,
      }),
    ).not.toThrow()
  })
})
