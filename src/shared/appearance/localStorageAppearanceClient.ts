import { deviceStorage, type DeviceStorage } from '../storage/deviceStorage'
import type { AppearanceClient, ColorInversion } from './appearanceClient'

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

function storedColorInversion(storage: DeviceStorage | null): ColorInversion {
  if (isSwitchedOn(storage, INVERTED_COLORS_KEY)) return 'everything'
  if (isSwitchedOn(storage, INVERTED_BUTTONS_KEY)) return 'buttonsOnly'
  return 'none'
}

export function createLocalStorageAppearanceClient(
  storage: DeviceStorage | null = deviceStorage(),
): AppearanceClient {
  return {
    readColorInversion: () => storedColorInversion(storage),
    writeColorInversion: (colorInversion) => {
      store(storage, INVERTED_COLORS_KEY, colorInversion === 'everything')
      store(storage, INVERTED_BUTTONS_KEY, colorInversion === 'buttonsOnly')
    },
  }
}
