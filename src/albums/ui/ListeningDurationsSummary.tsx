import {
  albumsWithoutPlayingTimeHint,
  listeningDurationsLabel,
} from '../domain/albumAnnouncements'
import { clockDuration } from '../domain/duration'
import type { ListeningDurations } from '../domain/listeningDuration'
import { CalendarIcon } from './CalendarIcon'
import { RecordIcon } from './RecordIcon'

export function ListeningDurationsSummary({
  durations,
}: {
  durations: ListeningDurations
}) {
  return (
    <div className="listeningDurations">
      <p>
        <span aria-hidden="true" className="albumStats">
          <CalendarIcon />
          <span className="sum">{clockDuration(durations.thisMonth)}</span>
          <RecordIcon />
          <span className="sum">{clockDuration(durations.inTotal)}</span>
        </span>
        <span className="visuallyHidden">
          {listeningDurationsLabel(durations)}
        </span>
      </p>
      {durations.albumsWithoutPlayingTime > 0 && (
        <p>
          {albumsWithoutPlayingTimeHint(durations.albumsWithoutPlayingTime)}
        </p>
      )}
    </div>
  )
}
