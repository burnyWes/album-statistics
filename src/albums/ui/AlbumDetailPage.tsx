import { useEffect, useRef } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { albumName, type Album } from '../domain/album'
import { listeningsHeading } from '../domain/albumAnnouncements'
import {
  lastListening,
  listeningsInTotal,
  listeningsNewestFirst,
  listeningsThisMonth,
} from '../domain/listening'
import { ArrowUpIcon } from './ArrowUpIcon'
import { CalendarIcon } from './CalendarIcon'
import { EditIcon } from './EditIcon'
import { ListeningTime } from './ListeningTime'
import { RecordIcon } from './RecordIcon'

export type AlbumDetailFocus = 'album' | 'listenings'

type AlbumDetailPageProps = {
  album: Album
  now: Date
  focus: AlbumDetailFocus
  onBack: () => void
  onListen: () => void
  onEdit: () => void
}

export function AlbumDetailPage({
  album,
  now,
  focus,
  onBack,
  onListen,
  onEdit,
}: AlbumDetailPageProps) {
  const albumHeading = useRef<HTMLHeadingElement>(null)
  const listeningsHeadingElement = useRef<HTMLHeadingElement>(null)
  const lastListened = lastListening(album)

  useEffect(() => {
    const focusedHeading =
      focus === 'album' ? albumHeading : listeningsHeadingElement
    focusedHeading.current?.focus()
  }, [focus])

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Alben
      </button>
      <h1 ref={albumHeading} tabIndex={-1}>
        {albumName(album)}
      </h1>
      <div className="albumDetailStats">
        <p>
          <CalendarIcon />
          Diesen Monat {listeningsThisMonth(album, now)}
        </p>
        <p>
          <RecordIcon />
          Insgesamt {listeningsInTotal(album)}
        </p>
        {lastListened !== null && (
          <p>
            Zuletzt gehört: <ListeningTime listening={lastListened} />
          </p>
        )}
      </div>
      <h2 ref={listeningsHeadingElement} tabIndex={-1}>
        {listeningsHeading(album)}
      </h2>
      {lastListened === null ? (
        <p>Noch nicht gehört.</p>
      ) : (
        <ul className="itemList listeningList">
          {listeningsNewestFirst(album).map((listening, position) => (
            <li key={`${position}-${listening}`}>
              <ListeningTime listening={listening} />
            </li>
          ))}
        </ul>
      )}
      <BottomBar>
        <button type="button" onClick={onListen}>
          <ArrowUpIcon />
          Gehört
        </button>
        <button type="button" onClick={onEdit}>
          <EditIcon />
          Bearbeiten
        </button>
      </BottomBar>
    </main>
  )
}
