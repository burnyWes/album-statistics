import {
  NO_COLOR_INVERSION,
  type AppearanceClient,
  type ColorInversion,
} from './appearanceClient'

export type StoringAppearanceClient = AppearanceClient & {
  storedColorInversion(): ColorInversion
}

export function createInMemoryAppearanceClient(
  colorInversion: Partial<ColorInversion> = {},
): StoringAppearanceClient {
  let storedColorInversion = { ...NO_COLOR_INVERSION, ...colorInversion }

  return {
    readColorInversion: () => storedColorInversion,
    writeColorInversion: (wanted) => {
      storedColorInversion = wanted
    },
    storedColorInversion: () => storedColorInversion,
  }
}
