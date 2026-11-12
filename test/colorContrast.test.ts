import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from './colorContrast.ts'

const TEXT_CONTRAST = 4.5
const GRAPHICS_CONTRAST = 3

const stylesheet = readFileSync('src/index.css', 'utf8')

const LIGHT_SELECTOR = ':root'
const DARK_SELECTOR = ":root[data-inverted-colors='true']"
const INVERTED_BUTTONS_SELECTOR = ":root[data-inverted-buttons='true']"

const BUTTON_COLORS = [
  '--accent',
  '--accentInk',
  '--accentLine',
  '--quietButton',
  '--quietButtonInk',
  '--disabled',
  '--disabledLine',
  '--disabledInk',
]

function escapedForPattern(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function paletteOf(selector: string): Record<string, string> {
  const block = new RegExp(
    `^${escapedForPattern(selector)}\\s*\\{([^}]*)\\}`,
    'm',
  ).exec(stylesheet)?.[1]
  if (block === undefined) throw new Error(`No block for ${selector}`)
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map(
      ([, variable, color]) => [variable, color],
    ),
  )
}

const REQUIRED_PAIRS = [
  { foreground: '--ink', background: '--surface', minimum: TEXT_CONTRAST },
  {
    foreground: '--accentInk',
    background: '--accent',
    minimum: TEXT_CONTRAST,
  },
  {
    foreground: '--disabledInk',
    background: '--disabled',
    minimum: TEXT_CONTRAST,
  },
  { foreground: '--failure', background: '--surface', minimum: TEXT_CONTRAST },
  {
    foreground: '--quietButtonInk',
    background: '--quietButton',
    minimum: TEXT_CONTRAST,
  },
  {
    foreground: '--accentLine',
    background: '--quietButton',
    minimum: GRAPHICS_CONTRAST,
  },
  {
    foreground: '--checkMark',
    background: '--surface',
    minimum: GRAPHICS_CONTRAST,
  },
] as const

describe('contrastRatio', () => {
  it('rates black on white as the strongest contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21)
  })
})

function inverted(hexColor: string): string {
  const channels = [1, 3, 5].map((start) =>
    (255 - Number.parseInt(hexColor.slice(start, start + 2), 16))
      .toString(16)
      .padStart(2, '0'),
  )
  return `#${channels.join('')}`
}

function invertedPalette(
  palette: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(palette).map(([variable, color]) => [
      variable,
      inverted(color),
    ]),
  )
}

const lightPalette = paletteOf(LIGHT_SELECTOR)

describe('the dark colour scheme', () => {
  it('inverts every colour of the light scheme exactly', () => {
    expect(paletteOf(DARK_SELECTOR)).toEqual(invertedPalette(lightPalette))
  })
})

describe('the inverted buttons', () => {
  it('invert exactly the button colours of the light scheme', () => {
    const lightButtonColors = Object.fromEntries(
      BUTTON_COLORS.map((variable) => [variable, lightPalette[variable]]),
    )

    expect(paletteOf(INVERTED_BUTTONS_SELECTOR)).toEqual(
      invertedPalette(lightButtonColors),
    )
  })
})

const SCHEMES = [
  { name: 'light', palette: lightPalette },
  { name: 'dark', palette: paletteOf(DARK_SELECTOR) },
  {
    name: 'inverted buttons',
    palette: { ...lightPalette, ...paletteOf(INVERTED_BUTTONS_SELECTOR) },
  },
]

describe.each(SCHEMES)('the $name colour scheme', ({ palette }) => {
  it.each(REQUIRED_PAIRS)(
    '$foreground on $background reaches $minimum : 1',
    ({ foreground, background, minimum }) => {
      expect(palette[foreground]).toBeDefined()
      expect(palette[background]).toBeDefined()

      expect(
        contrastRatio(palette[foreground], palette[background]),
      ).toBeGreaterThanOrEqual(minimum)
    },
  )
})
