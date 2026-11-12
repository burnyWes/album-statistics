import { describe, expect, it } from 'vitest'
import { InvalidAlbum, type Album } from './album'
import {
  albumDeletedAnnouncement,
  albumFailureMessage,
  albumOrderChangedAnnouncement,
  albumOrderLabel,
  albumRowLabel,
  albumSavedAnnouncement,
  albumsLoadedAnnouncement,
  albumsSavedAnnouncement,
  coverChosenAnnouncement,
  coverRemovedAnnouncement,
  albumsHeading,
  deleteListeningLabel,
  deleteListeningQuestion,
  deletionConsequence,
  listenedAnnouncement,
  listenedButtonLabel,
  listeningDeletedAnnouncement,
  listeningsHeading,
  listeningTakenBackAnnouncement,
  shareAnnouncement,
  storageFullMessage,
  undoListeningLabel,
  unreadableAlbumsFileMessage,
  unreadableCoverMessage,
} from './albumAnnouncements'
import { listeningAt } from './listening'

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

  it('names a link that is no spotify link', () => {
    expect(albumFailureMessage(new InvalidAlbum('spotifyLinkInvalid'))).toBe(
      'Das ist kein Spotify-Link.',
    )
  })

  it('knows no message for foreign errors', () => {
    expect(albumFailureMessage(new Error('broken'))).toBeNull()
  })
})

describe('storage and cover texts', () => {
  it('names a full storage', () => {
    expect(storageFullMessage).toBe(
      'Der Speicher ist voll. Es wurde nichts geändert.',
    )
  })

  it('names an unreadable image', () => {
    expect(unreadableCoverMessage).toBe(
      'Dieses Bild konnte nicht gelesen werden.',
    )
  })

  it('announces a chosen and a removed cover', () => {
    expect(coverChosenAnnouncement).toBe('Cover gewählt.')
    expect(coverRemovedAnnouncement).toBe('Cover entfernt.')
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
    spotifyLink: null,
    cover: null,
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

const now = new Date(2026, 10, 15, 12, 0)

function kindOfBlueListenedSince(
  thisMonth: number,
  inEarlierMonths: number,
): Album {
  const listenings = [
    ...Array.from({ length: inEarlierMonths }, () =>
      listeningAt(new Date(2026, 9, 3)),
    ),
    ...Array.from({ length: thisMonth }, () => listeningAt(now)),
  ]
  return { ...kindOfBlueListened(0), listenings }
}

describe('listening texts', () => {
  it('labels the row with both counts', () => {
    expect(albumRowLabel(kindOfBlueListenedSince(3, 11), now)).toBe(
      'Kind of Blue, Miles Davis. Diesen Monat 3 Mal, insgesamt 14 Mal gehört.',
    )
  })

  it('labels the listened button', () => {
    expect(listenedButtonLabel(kindOfBlueListened(1))).toBe(
      'Kind of Blue, Miles Davis gehört',
    )
  })

  it('announces a listening with both counts', () => {
    expect(listenedAnnouncement(kindOfBlueListenedSince(3, 11), now)).toBe(
      'Kind of Blue, Miles Davis gehört. Diesen Monat 3, insgesamt 14.',
    )
  })

  it('announces a listening taken back with both counts', () => {
    expect(
      listeningTakenBackAnnouncement(kindOfBlueListenedSince(2, 11), now),
    ).toBe(
      'Kind of Blue, Miles Davis: Hören zurückgenommen. Diesen Monat 2, insgesamt 13.',
    )
  })

  it('labels taking back a listening', () => {
    expect(undoListeningLabel({ title: 'Greatest Hits', artist: '' })).toBe(
      'Rückgängig: Greatest Hits',
    )
  })
})

describe('listeningsHeading', () => {
  it('names only the listenings while there are none', () => {
    expect(listeningsHeading(kindOfBlueListened(0))).toBe('Gehört')
  })

  it('names a single listening', () => {
    expect(listeningsHeading(kindOfBlueListened(1))).toBe('Gehört, 1 Mal')
  })

  it('names several listenings', () => {
    expect(listeningsHeading(kindOfBlueListened(14))).toBe('Gehört, 14 Mal')
  })
})

describe('deleting a listening', () => {
  const listening = listeningAt(new Date(2026, 10, 12, 14, 20))

  it('labels deleting a listening with the spoken time', () => {
    expect(deleteListeningLabel(listening)).toBe(
      'Hören vom Donnerstag, 12.11.2026, 14:20 löschen',
    )
  })

  it('asks before deleting a listening', () => {
    expect(deleteListeningQuestion(listening)).toBe(
      'Hören vom Donnerstag, 12.11.2026, 14:20 löschen?',
    )
  })

  it('announces a deleted listening with both counts', () => {
    expect(
      listeningDeletedAnnouncement(
        kindOfBlueListenedSince(3, 11),
        listening,
        now,
      ),
    ).toBe(
      'Hören vom Donnerstag, 12.11.2026, 14:20 gelöscht. Diesen Monat 3, insgesamt 14.',
    )
  })
})

describe('album order texts', () => {
  it('labels the three orders', () => {
    expect(albumOrderLabel('alphabetical')).toBe('Alphabetisch')
    expect(albumOrderLabel('thisMonth')).toBe('Diesen Monat am meisten gehört')
    expect(albumOrderLabel('inTotal')).toBe('Insgesamt am meisten gehört')
  })

  it('announces the order and the first album', () => {
    expect(
      albumOrderChangedAnnouncement('inTotal', {
        title: 'Kind of Blue',
        artist: 'Miles Davis',
      }),
    ).toBe(
      'Sortiert: Insgesamt am meisten gehört. Zuerst: Kind of Blue, Miles Davis.',
    )
  })

  it('announces a first album without artist', () => {
    expect(
      albumOrderChangedAnnouncement('alphabetical', {
        title: 'Greatest Hits',
        artist: '',
      }),
    ).toBe('Sortiert: Alphabetisch. Zuerst: Greatest Hits.')
  })
})

describe('saving and loading data', () => {
  function merged(addedAlbums: number, extendedAlbums: number) {
    return { albums: [], addedAlbums, extendedAlbums }
  }

  it('announces the saved file', () => {
    expect(albumsSavedAnnouncement('album-statistics-2026-11-15.json')).toBe(
      'Daten gespeichert als album-statistics-2026-11-15.json.',
    )
  })

  it('announces new and extended albums', () => {
    expect(albumsLoadedAnnouncement(merged(2, 3))).toBe(
      'Daten geladen. 2 Alben neu, 3 Alben ergänzt.',
    )
  })

  it('announces only new albums', () => {
    expect(albumsLoadedAnnouncement(merged(2, 0))).toBe(
      'Daten geladen. 2 Alben neu.',
    )
  })

  it('announces only extended albums', () => {
    expect(albumsLoadedAnnouncement(merged(0, 3))).toBe(
      'Daten geladen. 3 Alben ergänzt.',
    )
  })

  it('names a single album', () => {
    expect(albumsLoadedAnnouncement(merged(1, 1))).toBe(
      'Daten geladen. 1 Album neu, 1 Album ergänzt.',
    )
    expect(albumsLoadedAnnouncement(merged(0, 1))).toBe(
      'Daten geladen. 1 Album ergänzt.',
    )
  })

  it('announces that nothing was new', () => {
    expect(albumsLoadedAnnouncement(merged(0, 0))).toBe(
      'Daten geladen. Es war nichts Neues dabei.',
    )
  })

  it('names an unreadable file', () => {
    expect(unreadableAlbumsFileMessage).toBe(
      'Diese Datei enthält keine lesbaren Album-Daten. Es wurde nichts geändert.',
    )
  })

  it('announces the share results', () => {
    expect(shareAnnouncement('shared')).toBe('Daten geteilt.')
    expect(shareAnnouncement('dismissed')).toBe('Teilen abgebrochen.')
    expect(shareAnnouncement('failed')).toBe('Teilen hat nicht geklappt.')
  })
})
