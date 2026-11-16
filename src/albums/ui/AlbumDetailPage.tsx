import { useEffect, useRef } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { albumName, type Album, type Listening } from '../domain/album'
import { listeningsHeading } from '../domain/albumAnnouncements'
import {
  lastListening,
  listeningMonthsNewestFirst,
  listeningsInTotal,
  listeningsThisMonth,
} from '../domain/listening'
import {
  listeningDurationInTotal,
  listeningDurationThisMonth,
} from '../domain/listeningDuration'
import { SpeakerIcon } from './SpeakerIcon'
import { AlbumDetailCover } from './AlbumCover'
import { CalendarIcon } from './CalendarIcon'
import { Duration } from './Duration'
import { EditIcon } from './EditIcon'
import { ExternalLinkIcon } from './ExternalLinkIcon'
import { ListeningCount } from './ListeningCount'
import { ListeningMonthSection } from './ListeningMonthSection'
import { ListeningTime } from './ListeningTime'
import { RecordIcon } from './RecordIcon'
import { StopwatchIcon } from './StopwatchIcon'

export type AlbumDetailFocus = 'album' | 'listenings'

type AlbumDetailPageProps = {
  album: Album
  now: Date
  focus: AlbumDetailFocus
  onBack: () => void
  onListen: () => void
  onEdit: () => void
  onDeleteListening: (listening: Listening) => void
}

export function AlbumDetailPage({
  album,
  now,
  focus,
  onBack,
  onListen,
  onEdit,
  onDeleteListening,
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
      <AlbumDetailCover cover={album.cover} />
      <div className="albumDetailStats">
        {album.playingTime !== null && (
          <p>
            <StopwatchIcon />
            Spieldauer <Duration seconds={album.playingTime} />
          </p>
        )}
        <p>
          <CalendarIcon />
          Diesen Monat{' '}
          <ListeningCount
            count={listeningsThisMonth(album, now)}
            duration={listeningDurationThisMonth(album, now)}
          />
        </p>
        <p>
          <RecordIcon />
          Insgesamt{' '}
          <ListeningCount
            count={listeningsInTotal(album)}
            duration={listeningDurationInTotal(album)}
          />
        </p>
        {lastListened !== null && (
          <p>
            Zuletzt gehört: <ListeningTime listening={lastListened} />
          </p>
        )}
      </div>
      {album.spotifyLink !== null && (
        <a
          className="linkButton"
          href={album.spotifyLink}
          target="_blank"
          rel="noopener"
        >
          <ExternalLinkIcon />
          Auf Spotify öffnen
        </a>
      )}
      <h2 ref={listeningsHeadingElement} tabIndex={-1}>
        {listeningsHeading(album)}
      </h2>
      {lastListened === null ? (
        <p>Noch nicht gehört.</p>
      ) : (
        listeningMonthsNewestFirst(album).map((month) => (
          <ListeningMonthSection
            key={`${month.year}-${month.monthIndex}`}
            month={month}
            onDeleteListening={onDeleteListening}
          />
        ))
      )}
      <BottomBar>
        <button type="button" onClick={onListen}>
          <SpeakerIcon />
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
