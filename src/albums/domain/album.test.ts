import { describe, expect, it } from 'vitest'
import { InvalidAlbum, newAlbum } from './album'

describe('newAlbum', () => {
  it('keeps title and artist without surrounding blanks', () => {
    expect(newAlbum('  Kind of Blue ', ' Miles Davis  ')).toEqual({
      title: 'Kind of Blue',
      artist: 'Miles Davis',
    })
  })

  it('rejects an album without title', () => {
    expect(() => newAlbum('   ', 'Miles Davis')).toThrow(
      new InvalidAlbum('titleMissing'),
    )
  })

  it('rejects an album without artist', () => {
    expect(() => newAlbum('Kind of Blue', '')).toThrow(
      new InvalidAlbum('artistMissing'),
    )
  })
})
