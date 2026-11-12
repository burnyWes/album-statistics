import type { ReactNode } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { Album, AlbumId } from '../domain/album'
import { albumsHeading } from '../domain/albumAnnouncements'
import { AlbumListRow } from './AlbumListRow'

export type UndoListening = { label: string; onUndo: () => void }

export type ListenButtonFocusRequest = { albumId: AlbumId; request: number }

type AlbumListPageProps = {
  navigation: ReactNode
  albums: readonly Album[]
  now: Date
  undoListening: UndoListening | null
  listenButtonFocusRequest: ListenButtonFocusRequest | null
  onAddAlbum: () => void
  onOpenAlbum: (album: Album) => void
  onListen: (album: Album) => void
}

export function AlbumListPage({
  navigation,
  albums,
  now,
  undoListening,
  listenButtonFocusRequest,
  onAddAlbum,
  onOpenAlbum,
  onListen,
}: AlbumListPageProps) {
  const heading = useHeadingFocus()

  function focusRequestFor(album: Album): number {
    return listenButtonFocusRequest?.albumId === album.id
      ? listenButtonFocusRequest.request
      : 0
  }

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            {albumsHeading(albums.length)}
          </h1>
          <button
            type="button"
            className="addItemButton"
            aria-label="Album hinzufügen"
            onClick={onAddAlbum}
          >
            +
          </button>
        </div>
        {albums.length === 0 ? (
          <p>Noch keine Alben.</p>
        ) : (
          <ul className="itemList">
            {albums.map((album) => (
              <AlbumListRow
                key={album.id}
                album={album}
                now={now}
                listenButtonFocusRequest={focusRequestFor(album)}
                onOpenAlbum={onOpenAlbum}
                onListen={onListen}
              />
            ))}
          </ul>
        )}
        {undoListening !== null && (
          <BottomBar>
            <button type="button" onClick={undoListening.onUndo}>
              {undoListening.label}
            </button>
          </BottomBar>
        )}
      </main>
    </>
  )
}
