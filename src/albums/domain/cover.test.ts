import { describe, expect, it } from 'vitest'
import { isCover } from './cover'

describe('isCover', () => {
  it.each([
    'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
    'data:image/png;base64,iVBORw0KGgo=',
  ])('accepts the image %j', (value) => {
    expect(isCover(value)).toBe(true)
  })

  it.each([
    'data:image/svg+xml;base64,PHN2Zz4=',
    'data:text/html;base64,PGgxPg==',
    'https://example.com/cover.jpg',
    '',
    'data:image/jpeg;base64,/9j/4AA"onerror="x',
    'data:image/jpeg;base64,',
  ])('rejects %j', (value) => {
    expect(isCover(value)).toBe(false)
  })

  it('rejects values that are no text', () => {
    expect(isCover(null)).toBe(false)
    expect(isCover(42)).toBe(false)
  })
})
