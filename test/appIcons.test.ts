import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { manifestIcons } from '../vite.config.ts'

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])
const IHDR_WIDTH_OFFSET = 16
const IHDR_HEIGHT_OFFSET = 20

function pngDimensions(fileName: string) {
  const png = readFileSync(join('public', fileName))
  return {
    signature: png.subarray(0, PNG_SIGNATURE.length),
    sizes: `${png.readUInt32BE(IHDR_WIDTH_OFFSET)}x${png.readUInt32BE(IHDR_HEIGHT_OFFSET)}`,
  }
}

const expectedIcons = [
  ...manifestIcons.map(({ src, sizes }) => ({ src, sizes })),
  { src: 'apple-touch-icon.png', sizes: '180x180' },
]

describe('app icons', () => {
  it('lists a PNG icon in the manifest', () => {
    expect(manifestIcons.length).toBeGreaterThan(0)
  })

  it.each(expectedIcons)('$src is a PNG of $sizes', ({ src, sizes }) => {
    const icon = pngDimensions(src)

    expect(icon.signature.equals(PNG_SIGNATURE)).toBe(true)
    expect(icon.sizes).toBe(sizes)
  })
})
