import { deviceStorage, type DeviceStorage } from '../storage/deviceStorage'
import type { AppearanceClient } from './appearanceClient'

export const INVERTED_COLORS_KEY = 'invertedColors'

function storedValue(storage: DeviceStorage | null): string | null {
  try {
    return storage?.getItem(INVERTED_COLORS_KEY) ?? null
  } catch {
    return null
  }
}

function store(storage: DeviceStorage | null, invertedColors: boolean): void {
  try {
    storage?.setItem(INVERTED_COLORS_KEY, String(invertedColors))
  } catch {
    return
  }
}

export function createLocalStorageAppearanceClient(
  storage: DeviceStorage | null = deviceStorage(),
): AppearanceClient {
  return {
    readInvertedColors: () => storedValue(storage) === 'true',
    writeInvertedColors: (invertedColors) => store(storage, invertedColors),
  }
}
