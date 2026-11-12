export type ColorInversion = {
  invertedColors: boolean
  invertedButtons: boolean
}

export const NO_COLOR_INVERSION: ColorInversion = {
  invertedColors: false,
  invertedButtons: false,
}

export interface AppearanceClient {
  readColorInversion(): ColorInversion
  writeColorInversion(colorInversion: ColorInversion): void
}
