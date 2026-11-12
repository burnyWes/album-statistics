import { useEffect, useState } from 'react'
import type { AppearanceClient, ColorInversion } from './appearanceClient'

export type Appearance = ColorInversion & {
  toggleInvertedColors: () => void
  toggleInvertedButtons: () => void
}

function applySystemBarColor() {
  const systemBar = document.querySelector('meta[name="theme-color"]')
  const systemBarColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--accentLine')
    .trim()
  if (systemBar && systemBarColor)
    systemBar.setAttribute('content', systemBarColor)
}

function markTheRoot({ invertedColors, invertedButtons }: ColorInversion) {
  const { dataset } = document.documentElement
  dataset.invertedColors = String(invertedColors)
  dataset.invertedButtons = String(invertedButtons)
}

export function useAppearance(appearanceClient: AppearanceClient): Appearance {
  const [colorInversion, setColorInversion] = useState(() =>
    appearanceClient.readColorInversion(),
  )

  useEffect(() => {
    markTheRoot(colorInversion)
    applySystemBarColor()
  }, [colorInversion])

  function change(wanted: ColorInversion) {
    appearanceClient.writeColorInversion(wanted)
    setColorInversion(wanted)
  }

  return {
    ...colorInversion,
    toggleInvertedColors: () =>
      change({
        ...colorInversion,
        invertedColors: !colorInversion.invertedColors,
      }),
    toggleInvertedButtons: () =>
      change({
        ...colorInversion,
        invertedButtons: !colorInversion.invertedButtons,
      }),
  }
}
