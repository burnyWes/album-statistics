import { useEffect, useState } from 'react'
import type { AppearanceClient } from './appearanceClient'

export type Appearance = {
  invertedColors: boolean
  toggleInvertedColors: () => void
}

function applySystemBarColor() {
  const systemBar = document.querySelector('meta[name="theme-color"]')
  const systemBarColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--systemBar')
    .trim()
  if (systemBar && systemBarColor)
    systemBar.setAttribute('content', systemBarColor)
}

export function useAppearance(appearanceClient: AppearanceClient): Appearance {
  const [invertedColors, setInvertedColors] = useState(() =>
    appearanceClient.readInvertedColors(),
  )

  useEffect(() => {
    document.documentElement.dataset.invertedColors = String(invertedColors)
    applySystemBarColor()
  }, [invertedColors])

  return {
    invertedColors,
    toggleInvertedColors() {
      const wanted = !invertedColors
      appearanceClient.writeInvertedColors(wanted)
      setInvertedColors(wanted)
    },
  }
}
