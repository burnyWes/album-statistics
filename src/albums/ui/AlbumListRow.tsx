import { useEffect, useRef } from 'react'
import { albumName, type Album } from '../domain/album'
import {
  albumRowLabel,
  listenedButtonLabel,
} from '../domain/albumAnnouncements'
import { listeningsInTotal, listeningsThisMonth } from '../domain/listening'
import { ArrowUpIcon } from './ArrowUpIcon'
import { CalendarIcon } from './CalendarIcon'
import { RecordIcon } from './RecordIcon'

type AlbumListRowProps = {
  album: Album
  now: Date
  focusOnMount: boolean
  listenButtonFocusRequest: number
  onOpenAlbum: (album: Album) => void
  onListen: (album: Album) => void
}

export function AlbumListRow({
  album,
  now,
  focusOnMount,
  listenButtonFocusRequest,
  onOpenAlbum,
  onListen,
}: AlbumListRowProps) {
  const rowButton = useRef<HTMLButtonElement>(null)
  const listenButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (focusOnMount) rowButton.current?.focus()
  }, [focusOnMount])

  useEffect(() => {
    if (listenButtonFocusRequest > 0) listenButton.current?.focus()
  }, [listenButtonFocusRequest])

  return (
    <li className="listRow">
      <button
        type="button"
        ref={rowButton}
        className="rowButton"
        aria-label={albumRowLabel(album, now)}
        onClick={() => onOpenAlbum(album)}
      >
        <span className="albumName">{albumName(album)}</span>
        <span className="albumStats">
          <CalendarIcon />
          {listeningsThisMonth(album, now)}
          <RecordIcon />
          {listeningsInTotal(album)}
        </span>
      </button>
      <button
        type="button"
        ref={listenButton}
        className="iconButton"
        aria-label={listenedButtonLabel(album)}
        onClick={() => onListen(album)}
      >
        <ArrowUpIcon />
      </button>
    </li>
  )
}
