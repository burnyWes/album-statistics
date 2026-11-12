import { deviceStorage, type DeviceStorage } from '../storage/deviceStorage'
import type { AppearanceClient } from './appearanceClient'

export const INVERTED_COLORS_KEY = 'invertedColors'
export const INVERTED_BUTTONS_KEY = 'invertedButtons'

function isSwitchedOn(storage: DeviceStorage | null, key: string): boolean {
  try {
    return storage?.getItem(key) === 'true'
  } catch {
    return false
  }
}

function store(storage: DeviceStorage | null, key: string, on: boolean): void {
  try {
    storage?.setItem(key, String(on))
  } catch {
    return
  }
}

export function createLocalStorageAppearanceClient(
  storage: DeviceStorage | null = deviceStorage(),
): AppearanceClient {
  return {
    readColorInversion: () => ({
      invertedColors: isSwitchedOn(storage, INVERTED_COLORS_KEY),
      invertedButtons: isSwitchedOn(storage, INVERTED_BUTTONS_KEY),
    }),
    writeColorInversion: ({ invertedColors, invertedButtons }) => {
      store(storage, INVERTED_COLORS_KEY, invertedColors)
      store(storage, INVERTED_BUTTONS_KEY, invertedButtons)
    },
  }
}
