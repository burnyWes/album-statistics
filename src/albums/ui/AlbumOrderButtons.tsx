import type { ReactNode } from 'react'
import { albumOrderLabel } from '../domain/albumAnnouncements'
import { ALBUM_ORDERS, type AlbumOrder } from '../domain/albumOrder'
import { AlphabeticalIcon } from './AlphabeticalIcon'
import { CalendarIcon } from './CalendarIcon'
import { RecordIcon } from './RecordIcon'

const buttonsByOrder: Record<AlbumOrder, { icon: ReactNode; text: string }> = {
  alphabetical: { icon: <AlphabeticalIcon />, text: 'A–Z' },
  thisMonth: { icon: <CalendarIcon />, text: 'Monat' },
  inTotal: { icon: <RecordIcon />, text: 'Gesamt' },
}

type AlbumOrderButtonsProps = {
  order: AlbumOrder
  onChangeOrder: (order: AlbumOrder) => void
}

export function AlbumOrderButtons({
  order,
  onChangeOrder,
}: AlbumOrderButtonsProps) {
  return (
    <div role="group" aria-label="Sortierung" className="albumOrder">
      {ALBUM_ORDERS.map((offered) => (
        <button
          key={offered}
          type="button"
          aria-pressed={order === offered}
          aria-label={albumOrderLabel(offered)}
          onClick={() => onChangeOrder(offered)}
        >
          {buttonsByOrder[offered].icon}
          <span>{buttonsByOrder[offered].text}</span>
        </button>
      ))}
    </div>
  )
}
