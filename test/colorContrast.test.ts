import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrastRatio } from './colorContrast.ts'

const TEXT_CONTRAST = 4.5
const GRAPHICS_CONTRAST = 3

const stylesheet = readFileSync('src/index.css', 'utf8')

const INVERTED_COLORS = ":root[data-inverted-colors='true']"
const INVERTED_BUTTONS = ":root[data-inverted-buttons='true']"
const INVERTED_BOTH = `${INVERTED_COLORS}[data-inverted-buttons='true']`

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
    background: '--surface',
    minimum: TEXT_CONTRAST,
  },
  { foreground: '--failure', background: '--surface', minimum: TEXT_CONTRAST },
  {
    foreground: '--accentLine',
    background: '--surface',
    minimum: GRAPHICS_CONTRAST,
  },
  {
    foreground: '--disabledLine',
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

const plain = paletteOf(':root')
const withInvertedColors = { ...plain, ...paletteOf(INVERTED_COLORS) }
const withInvertedButtons = { ...plain, ...paletteOf(INVERTED_BUTTONS) }
const withBothInverted = {
  ...withInvertedColors,
  ...paletteOf(INVERTED_BUTTONS),
  ...paletteOf(INVERTED_BOTH),
}

describe('the colour schemes', () => {
  it('turn into the exact opposite with both inversions', () => {
    expect(withBothInverted).toEqual(invertedPalette(plain))
  })

  it('mirror inverted colours and inverted buttons exactly', () => {
    expect(withInvertedColors).toEqual(invertedPalette(withInvertedButtons))
  })
})

const SCHEMES = [
  { name: 'plain', palette: plain },
  { name: 'inverted colours', palette: withInvertedColors },
  { name: 'inverted buttons', palette: withInvertedButtons },
  { name: 'fully inverted', palette: withBothInverted },
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
