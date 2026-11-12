import { useEffect, useState } from 'react'
import type { AppearanceClient, ColorInversion } from './appearanceClient'

export type ChosenColorInversion = Exclude<ColorInversion, 'none'>

export type Appearance = {
  colorInversion: ColorInversion
  toggleColorInversion: (chosen: ChosenColorInversion) => void
}

function applySystemBarColor() {
  const systemBar = document.querySelector('meta[name="theme-color"]')
  const systemBarColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--systemBar')
    .trim()
  if (systemBar && systemBarColor)
    systemBar.setAttribute('content', systemBarColor)
}

function markTheRoot(colorInversion: ColorInversion) {
  const { dataset } = document.documentElement
  dataset.invertedColors = String(colorInversion === 'everything')
  dataset.invertedButtons = String(colorInversion === 'buttonsOnly')
}

function toggled(
  current: ColorInversion,
  chosen: ChosenColorInversion,
): ColorInversion {
  return current === chosen ? 'none' : chosen
}

export function useAppearance(appearanceClient: AppearanceClient): Appearance {
  const [colorInversion, setColorInversion] = useState(() =>
    appearanceClient.readColorInversion(),
  )

  useEffect(() => {
    markTheRoot(colorInversion)
    applySystemBarColor()
  }, [colorInversion])

  return {
    colorInversion,
    toggleColorInversion(chosen) {
      const wanted = toggled(colorInversion, chosen)
      appearanceClient.writeColorInversion(wanted)
      setColorInversion(wanted)
    },
  }
}
