import { describe, expect, it } from 'vitest'
import { InvalidAlbum } from './album'
import {
  albumFailureMessage,
  albumSavedAnnouncement,
  albumsHeading,
} from './albumAnnouncements'

describe('albumsHeading', () => {
  it('names only the albums while there are none', () => {
    expect(albumsHeading(0)).toBe('Alben')
  })

  it('adds the count of albums', () => {
    expect(albumsHeading(3)).toBe('Alben, 3')
  })
})

describe('albumFailureMessage', () => {
  it('asks for a missing title', () => {
    expect(albumFailureMessage(new InvalidAlbum('titleMissing'))).toBe(
      'Bitte einen Albumnamen eingeben.',
    )
  })

  it('names an album already listed', () => {
    expect(albumFailureMessage(new InvalidAlbum('alreadyListed'))).toBe(
      'Dieses Album gibt es schon.',
    )
  })

  it('knows no message for foreign errors', () => {
    expect(albumFailureMessage(new Error('broken'))).toBeNull()
  })
})

describe('albumSavedAnnouncement', () => {
  it('names the saved album with its artist', () => {
    expect(
      albumSavedAnnouncement({ title: 'Kind of Blue', artist: 'Miles Davis' }),
    ).toBe('Kind of Blue, Miles Davis gespeichert.')
  })

  it('names the saved album without artist', () => {
    expect(albumSavedAnnouncement({ title: 'Greatest Hits', artist: '' })).toBe(
      'Greatest Hits gespeichert.',
    )
  })
})
