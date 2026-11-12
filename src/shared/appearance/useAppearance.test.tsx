import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ColorInversion } from './appearanceClient'
import { createInMemoryAppearanceClient } from './inMemoryAppearanceClient'
import { useAppearance } from './useAppearance'

const LIGHT_SYSTEM_BAR = '#b91c1c'
const INVERTED_SYSTEM_BAR = '#46e3e3'

function systemBar() {
  return document.querySelector('meta[name="theme-color"]')
}

function givenASystemBar(content = 'untouched') {
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  meta.setAttribute('content', content)
  document.head.append(meta)
}

function givenThePalette() {
  const palette = document.createElement('style')
  palette.textContent = `
    :root { --accentLine: ${LIGHT_SYSTEM_BAR}; }
    :root[data-inverted-colors='true'] { --accentLine: ${INVERTED_SYSTEM_BAR}; }
  `
  document.head.append(palette)
}

function renderAppearance(colorInversion: Partial<ColorInversion> = {}) {
  const appearanceClient = createInMemoryAppearanceClient(colorInversion)
  const { result } = renderHook(() => useAppearance(appearanceClient))
  return { appearance: result, appearanceClient }
}

function rootMarks() {
  const { invertedColors, invertedButtons } = document.documentElement.dataset
  return { invertedColors, invertedButtons }
}

describe('useAppearance', () => {
  beforeEach(() => {
    document.head.replaceChildren()
    delete document.documentElement.dataset.invertedColors
    delete document.documentElement.dataset.invertedButtons
  })

  it('paints the system bar in the system bar colour of the palette', () => {
    givenASystemBar()
    givenThePalette()

    renderAppearance()

    expect(systemBar()?.getAttribute('content')).toBe(LIGHT_SYSTEM_BAR)
  })

  it('turns the system bar over with the colours', () => {
    givenASystemBar()
    givenThePalette()
    const { appearance } = renderAppearance()

    act(() => appearance.current.toggleInvertedColors())

    expect(rootMarks()).toEqual({
      invertedColors: 'true',
      invertedButtons: 'false',
    })
    expect(systemBar()?.getAttribute('content')).toBe(INVERTED_SYSTEM_BAR)
  })

  it('leaves the system bar alone when the palette says nothing', () => {
    givenASystemBar()

    renderAppearance()

    expect(systemBar()?.getAttribute('content')).toBe('untouched')
  })

  it('inverts the buttons on top of the inverted colours', () => {
    const { appearance, appearanceClient } = renderAppearance({
      invertedColors: true,
    })

    act(() => appearance.current.toggleInvertedButtons())

    expect(appearanceClient.storedColorInversion()).toEqual({
      invertedColors: true,
      invertedButtons: true,
    })
    expect(rootMarks()).toEqual({
      invertedColors: 'true',
      invertedButtons: 'true',
    })
  })

  it('turns the inverted buttons off without touching the colours', () => {
    const { appearance, appearanceClient } = renderAppearance({
      invertedButtons: true,
    })

    act(() => appearance.current.toggleInvertedButtons())

    expect(appearance.current.invertedButtons).toBe(false)
    expect(appearanceClient.storedColorInversion()).toEqual({
      invertedColors: false,
      invertedButtons: false,
    })
  })
})
