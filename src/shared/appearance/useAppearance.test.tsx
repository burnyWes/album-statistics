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
    :root { --systemBar: ${LIGHT_SYSTEM_BAR}; }
    :root[data-inverted-colors='true'] { --systemBar: ${INVERTED_SYSTEM_BAR}; }
  `
  document.head.append(palette)
}

function renderAppearance(colorInversion: ColorInversion = 'none') {
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

    act(() => appearance.current.toggleColorInversion('everything'))

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

  it('inverts the buttons only and remembers it', () => {
    const { appearance, appearanceClient } = renderAppearance()

    act(() => appearance.current.toggleColorInversion('buttonsOnly'))

    expect(appearance.current.colorInversion).toBe('buttonsOnly')
    expect(appearanceClient.storedColorInversion()).toBe('buttonsOnly')
    expect(rootMarks()).toEqual({
      invertedColors: 'false',
      invertedButtons: 'true',
    })
  })

  it('replaces one inversion with the other', () => {
    const { appearance, appearanceClient } = renderAppearance('everything')

    act(() => appearance.current.toggleColorInversion('buttonsOnly'))

    expect(appearanceClient.storedColorInversion()).toBe('buttonsOnly')
  })

  it('turns the chosen inversion off again', () => {
    const { appearance, appearanceClient } = renderAppearance('buttonsOnly')

    act(() => appearance.current.toggleColorInversion('buttonsOnly'))

    expect(appearanceClient.storedColorInversion()).toBe('none')
    expect(rootMarks()).toEqual({
      invertedColors: 'false',
      invertedButtons: 'false',
    })
  })
})
