import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react'
import { BottomBar } from '../../shared/ui/BottomBar'
import { SaveIcon } from '../../shared/ui/SaveIcon'
import { TrashIcon } from '../../shared/ui/TrashIcon'
import { AlbumsStorageFull } from '../api/albumsClient'
import {
  UnreadableCoverImage,
  type CoverImageClient,
} from '../api/coverImageClient'
import {
  InvalidAlbum,
  newAlbum,
  type Album,
  type AlbumDraft,
  type InvalidAlbumReason,
  type NamedAlbum,
  type NewAlbum,
} from '../domain/album'
import {
  albumFailureMessage,
  coverChosenAnnouncement,
  coverRemovedAnnouncement,
  storageFullMessage,
  unreadableCoverMessage,
} from '../domain/albumAnnouncements'
import { CoverField } from './CoverField'

type AlbumFormPageProps = {
  editedAlbum: Album | null
  otherAlbums: readonly NamedAlbum[]
  coverImageClient: CoverImageClient
  onSave: (album: NewAlbum) => void
  onDelete: () => void
  onBack: () => void
  announce: (text: string) => void
}

function draftOf(album: Album | null): AlbumDraft {
  if (album === null)
    return { title: '', artist: '', spotifyLink: '', cover: null }
  return {
    title: album.title,
    artist: album.artist,
    spotifyLink: album.spotifyLink ?? '',
    cover: album.cover,
  }
}

export function AlbumFormPage({
  editedAlbum,
  otherAlbums,
  coverImageClient,
  onSave,
  onDelete,
  onBack,
  announce,
}: AlbumFormPageProps) {
  const [draft, setDraft] = useState(() => draftOf(editedAlbum))
  const [failureMessage, setFailureMessage] = useState('')
  const [processingCover, setProcessingCover] = useState(false)
  const titleField = useRef<HTMLInputElement>(null)
  const spotifyLinkField = useRef<HTMLInputElement>(null)
  const chooseCoverButton = useRef<HTMLButtonElement>(null)
  const saveButton = useRef<HTMLButtonElement>(null)
  const latestCoverRequest = useRef(0)
  const fieldsByReason: Record<
    InvalidAlbumReason,
    RefObject<HTMLInputElement | null>
  > = {
    titleMissing: titleField,
    spotifyLinkInvalid: spotifyLinkField,
    alreadyListed: titleField,
  }

  useEffect(() => {
    titleField.current?.focus()
  }, [])

  useEffect(() => {
    const coverRequests = latestCoverRequest
    return () => {
      coverRequests.current += 1
    }
  }, [])

  function change(part: Partial<AlbumDraft>) {
    setDraft((previous) => ({ ...previous, ...part }))
  }

  function showFailure(message: string) {
    setFailureMessage(message)
    announce(message)
  }

  async function chooseCover(file: File) {
    latestCoverRequest.current += 1
    const request = latestCoverRequest.current
    const isLatest = () => request === latestCoverRequest.current
    setProcessingCover(true)
    try {
      const cover = await coverImageClient.coverFromFile(file)
      if (!isLatest()) return
      change({ cover })
      setFailureMessage('')
      announce(coverChosenAnnouncement)
      chooseCoverButton.current?.focus()
    } catch (error) {
      if (!(error instanceof UnreadableCoverImage)) throw error
      if (isLatest()) showFailure(unreadableCoverMessage)
    } finally {
      if (isLatest()) setProcessingCover(false)
    }
  }

  function removeCover() {
    change({ cover: null })
    announce(coverRemovedAnnouncement)
    chooseCoverButton.current?.focus()
  }

  function saveAlbum(event: FormEvent) {
    event.preventDefault()
    if (processingCover) return
    try {
      onSave(newAlbum(draft, otherAlbums))
    } catch (error) {
      if (error instanceof AlbumsStorageFull) {
        showFailure(storageFullMessage)
        saveButton.current?.focus()
        return
      }
      const message = albumFailureMessage(error)
      if (message === null || !(error instanceof InvalidAlbum)) throw error
      showFailure(message)
      fieldsByReason[error.reason].current?.focus()
    }
  }

  return (
    <main className="page">
      <form noValidate onSubmit={saveAlbum}>
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
        <p className="field">
          <label htmlFor="albumSpotifyLink">Spotify-Link (optional)</label>
          <input
            id="albumSpotifyLink"
            ref={spotifyLinkField}
            type="url"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            value={draft.spotifyLink}
            aria-describedby="albumFailure"
            onChange={(event) => change({ spotifyLink: event.target.value })}
          />
        </p>
        <CoverField
          cover={draft.cover}
          chooseButton={chooseCoverButton}
          onChooseFile={(file) => void chooseCover(file)}
          onRemove={removeCover}
        />
        <p id="albumFailure" className="failure">
          {failureMessage}
        </p>
        <BottomBar>
          <button type="submit" ref={saveButton} disabled={processingCover}>
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
