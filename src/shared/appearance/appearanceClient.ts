export interface AppearanceClient {
  readInvertedColors(): boolean
  writeInvertedColors(invertedColors: boolean): void
}
