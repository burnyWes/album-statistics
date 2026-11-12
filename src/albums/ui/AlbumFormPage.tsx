import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { TrashIcon } from '../../shared/ui/TrashIcon'
import {
  newAlbum,
  type Album,
  type AlbumDraft,
  type NewAlbum,
} from '../domain/album'
import { albumFailureMessage } from '../domain/albumAnnouncements'

type AlbumFormPageProps = {
  editedAlbum: Album | null
  otherAlbums: readonly NewAlbum[]
  onSave: (album: NewAlbum) => void
  onDelete: () => void
  onBack: () => void
  announce: (text: string) => void
}

function draftOf(album: Album | null): AlbumDraft {
  if (album === null) return { title: '', artist: '' }
  return { title: album.title, artist: album.artist }
}

export function AlbumFormPage({
  editedAlbum,
  otherAlbums,
  onSave,
  onDelete,
  onBack,
  announce,
}: AlbumFormPageProps) {
  const [draft, setDraft] = useState(() => draftOf(editedAlbum))
  const [failureMessage, setFailureMessage] = useState('')
  const titleField = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleField.current?.focus()
  }, [])

  function change(part: Partial<AlbumDraft>) {
    setDraft((previous) => ({ ...previous, ...part }))
  }

  function saveAlbum(event: FormEvent) {
    event.preventDefault()
    try {
      onSave(newAlbum(draft, otherAlbums))
    } catch (error) {
      const message = albumFailureMessage(error)
      if (message === null) throw error
      setFailureMessage(message)
      announce(message)
      titleField.current?.focus()
    }
  }

  return (
    <main className="page">
      <form onSubmit={saveAlbum}>
        <button type="button" onClick={onBack}>
          {editedAlbum === null ? 'Zurück zu den Alben' : 'Zurück zum Album'}
        </button>
        <h1>
          {editedAlbum === null ? 'Album hinzufügen' : 'Album bearbeiten'}
        </h1>
        <p className="field">
          <label htmlFor="albumTitle">Albumname</label>
          <input
            id="albumTitle"
            ref={titleField}
            value={draft.title}
            aria-describedby="albumFailure"
            onChange={(event) => change({ title: event.target.value })}
          />
        </p>
        <p className="field">
          <label htmlFor="albumArtist">Bandname (optional)</label>
          <input
            id="albumArtist"
            value={draft.artist}
            aria-describedby="albumFailure"
            onChange={(event) => change({ artist: event.target.value })}
          />
        </p>
        <p id="albumFailure" className="failure">
          {failureMessage}
        </p>
        <BottomBar>
          <button type="submit">
            <SaveIcon />
            Speichern
          </button>
          {editedAlbum !== null && (
            <button type="button" onClick={onDelete}>
              <TrashIcon />
              Löschen
            </button>
          )}
        </BottomBar>
      </form>
    </main>
  )
}
