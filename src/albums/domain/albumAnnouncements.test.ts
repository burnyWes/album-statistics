import { describe, expect, it } from 'vitest'
import { InvalidAlbum, type Album } from './album'
import {
  albumDeletedAnnouncement,
  albumFailureMessage,
  albumSavedAnnouncement,
  albumsHeading,
  deletionConsequence,
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

function kindOfBlueListened(times: number): Album {
  return {
    id: 'kind-of-blue',
    title: 'Kind of Blue',
    artist: 'Miles Davis',
    listenings: Array.from({ length: times }, () => '2026-11-12T18:04:00.000Z'),
  }
}

describe('albumDeletedAnnouncement', () => {
  it('names the remaining albums', () => {
    expect(albumDeletedAnnouncement(kindOfBlueListened(0), 11)).toBe(
      'Kind of Blue, Miles Davis gelöscht. Noch 11 Alben.',
    )
  })

  it('names a single remaining album', () => {
    expect(albumDeletedAnnouncement(kindOfBlueListened(0), 1)).toBe(
      'Kind of Blue, Miles Davis gelöscht. Noch 1 Album.',
    )
  })

  it('tells that no albums remain', () => {
    expect(albumDeletedAnnouncement(kindOfBlueListened(0), 0)).toBe(
      'Kind of Blue, Miles Davis gelöscht. Keine Alben mehr.',
    )
  })
})

describe('deletionConsequence', () => {
  it('tells that nothing is lost without listenings', () => {
    expect(deletionConsequence(kindOfBlueListened(0))).toBe(
      'Es ist noch kein Hören erfasst.',
    )
  })

  it('names a single lost listening', () => {
    expect(deletionConsequence(kindOfBlueListened(1))).toBe(
      'Damit geht auch 1 Mal Hören verloren.',
    )
  })

  it('names several lost listenings', () => {
    expect(deletionConsequence(kindOfBlueListened(14))).toBe(
      'Damit gehen auch 14 Mal Hören verloren.',
    )
  })
})
