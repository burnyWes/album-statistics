import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import type { Album } from '../domain/album'
import { albumsHeading } from '../domain/albumAnnouncements'
import { AlbumListRow } from './AlbumListRow'

type AlbumListPageProps = {
  navigation: ReactNode
  albums: readonly Album[]
  onAddAlbum: () => void
}

export function AlbumListPage({
  navigation,
  albums,
  onAddAlbum,
}: AlbumListPageProps) {
  const heading = useHeadingFocus()

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
              <AlbumListRow key={album.id} album={album} />
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
