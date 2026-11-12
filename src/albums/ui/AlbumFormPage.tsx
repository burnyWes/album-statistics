import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { newAlbum, type AlbumDraft, type NewAlbum } from '../domain/album'
import { albumFailureMessage } from '../domain/albumAnnouncements'

type AlbumFormPageProps = {
  otherAlbums: readonly NewAlbum[]
  onSave: (album: NewAlbum) => void
  onBack: () => void
  announce: (text: string) => void
}

const EMPTY_DRAFT: AlbumDraft = { title: '', artist: '' }

export function AlbumFormPage({
  otherAlbums,
  onSave,
  onBack,
  announce,
}: AlbumFormPageProps) {
  const [draft, setDraft] = useState(EMPTY_DRAFT)
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
          Zurück zu den Alben
        </button>
        <h1>Album hinzufügen</h1>
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
        </BottomBar>
      </form>
    </main>
  )
}
