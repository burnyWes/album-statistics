import { describe, expect, it } from 'vitest'
import { InvalidAlbum, type Album } from './album'
import {
  albumDeletedAnnouncement,
  albumFailureMessage,
  albumRowLabel,
  albumSavedAnnouncement,
  albumsLoadedAnnouncement,
  albumsSavedAnnouncement,
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
  undoListeningLabel,
  unreadableAlbumsFileMessage,
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

describe('saving and loading data', () => {
  function merged(
    addedAlbums: number,
    extendedAlbums: number,
    addedListenings: number,
  ) {
    return { albums: [], addedAlbums, extendedAlbums, addedListenings }
  }

  it('announces the saved file', () => {
    expect(albumsSavedAnnouncement('album-statistics-2026-11-15.json')).toBe(
      'Daten gespeichert als album-statistics-2026-11-15.json.',
    )
  })

  it('announces new and extended albums', () => {
    expect(albumsLoadedAnnouncement(merged(3, 2, 25))).toBe(
      'Daten geladen. 3 Alben neu, 2 Alben um 25 Mal Hören ergänzt.',
    )
  })

  it('announces only new albums', () => {
    expect(albumsLoadedAnnouncement(merged(3, 0, 0))).toBe(
      'Daten geladen. 3 Alben neu.',
    )
  })

  it('announces only extended albums', () => {
    expect(albumsLoadedAnnouncement(merged(0, 2, 25))).toBe(
      'Daten geladen. 2 Alben um 25 Mal Hören ergänzt.',
    )
  })

  it('names a single album and listening', () => {
    expect(albumsLoadedAnnouncement(merged(1, 1, 1))).toBe(
      'Daten geladen. 1 Album neu, 1 Album um 1 Mal Hören ergänzt.',
    )
  })

  it('announces that nothing was new', () => {
    expect(albumsLoadedAnnouncement(merged(0, 0, 0))).toBe(
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
