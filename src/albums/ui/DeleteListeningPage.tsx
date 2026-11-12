import { BottomBar } from '../../shared/ui/BottomBar'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { albumName, type Album, type Listening } from '../domain/album'
import { deleteListeningQuestion } from '../domain/albumAnnouncements'

type DeleteListeningPageProps = {
  album: Album
  listening: Listening
  onDelete: () => void
  onCancel: () => void
}

export function DeleteListeningPage({
  album,
  listening,
  onDelete,
  onCancel,
}: DeleteListeningPageProps) {
  const heading = useHeadingFocus()

  return (
    <main className="page">
      <button type="button" onClick={onCancel}>
        Zurück zum Album
      </button>
      <h1 ref={heading} tabIndex={-1}>
        {deleteListeningQuestion(listening)}
      </h1>
      <p>{albumName(album)}</p>
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
