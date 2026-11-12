import { BottomBar } from '../../shared/ui/BottomBar'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { albumName, type Album } from '../domain/album'
import { deletionConsequence } from '../domain/albumAnnouncements'

type DeleteAlbumPageProps = {
  album: Album
  onDelete: () => void
  onCancel: () => void
}

export function DeleteAlbumPage({
  album,
  onDelete,
  onCancel,
}: DeleteAlbumPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onCancel}>
        Zurück zum Album
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {albumName(album)} löschen?
      </h1>
      <p>{deletionConsequence(album)}</p>
      <BottomBar>
        <button type="button" onClick={onDelete}>
          Löschen
        </button>
        <button type="button" onClick={onCancel}>
          Abbrechen
        </button>
      </BottomBar>
    </main>
  )
}
