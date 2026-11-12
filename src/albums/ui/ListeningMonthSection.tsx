import { TrashIcon } from '../../shared/ui/TrashIcon'
import type { Listening } from '../domain/album'
import { deleteListeningLabel } from '../domain/albumAnnouncements'
import type { ListeningMonth } from '../domain/listening'
import { listeningMonthName } from '../domain/listeningTime'
import { ListeningTime } from './ListeningTime'

type ListeningMonthSectionProps = {
  month: ListeningMonth
  onDeleteListening: (listening: Listening) => void
}

export function ListeningMonthSection({
  month,
  onDeleteListening,
}: ListeningMonthSectionProps) {
  const headingId = `listeningMonth-${month.year}-${month.monthIndex}`

  return (
    <>
      <h3 id={headingId}>{listeningMonthName(month)}</h3>
      <ul className="itemList listeningList" aria-labelledby={headingId}>
        {month.listenings.map((listening, position) => (
          <li key={`${position}-${listening}`} className="listRow">
            <span>
              <ListeningTime listening={listening} />
            </span>
            <button
              type="button"
              className="iconButton"
              aria-label={deleteListeningLabel(listening)}
              onClick={() => onDeleteListening(listening)}
            >
              <TrashIcon />
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
