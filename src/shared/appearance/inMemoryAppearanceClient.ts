import type { AppearanceClient, ColorInversion } from './appearanceClient'

export type StoringAppearanceClient = AppearanceClient & {
  storedColorInversion(): ColorInversion
}

export function createInMemoryAppearanceClient(
  colorInversion: ColorInversion = 'none',
): StoringAppearanceClient {
  let storedColorInversion = colorInversion

  return {
    readColorInversion: () => storedColorInversion,
    writeColorInversion: (wanted) => {
      storedColorInversion = wanted
    },
    storedColorInversion: () => storedColorInversion,
  }
}
