export type ColorInversion = 'none' | 'everything' | 'buttonsOnly'

export interface AppearanceClient {
  readColorInversion(): ColorInversion
  writeColorInversion(colorInversion: ColorInversion): void
}
