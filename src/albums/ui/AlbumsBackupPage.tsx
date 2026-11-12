import { useRef, useState, type ChangeEvent } from 'react'
import type { FileExportClient } from '../../shared/files/fileExportClient'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'
import { AlbumsStorageFull, type AlbumsClient } from '../api/albumsClient'
import {
  albumsDownloadFile,
  albumsFromFileText,
  albumsShareFile,
  UnreadableAlbumsFile,
} from '../api/albumsFile'
import {
  albumsLoadedAnnouncement,
  albumsSavedAnnouncement,
  shareAnnouncement,
  storageFullMessage,
  unreadableAlbumsFileMessage,
} from '../domain/albumAnnouncements'
import { useAlbums } from './useAlbums'

type AlbumsBackupPageProps = {
  albumsClient: AlbumsClient
  clock: () => Date
  fileExportClient: FileExportClient
  announce: (text: string) => void
  onBack: () => void
}

export function AlbumsBackupPage({
  albumsClient,
  clock,
  fileExportClient,
  announce,
  onBack,
}: AlbumsBackupPageProps) {
  const albums = useAlbums(albumsClient, clock)
  const heading = useHeadingFocus()
  const fileInput = useRef<HTMLInputElement>(null)
  const loadButton = useRef<HTMLButtonElement>(null)
  const [failureMessage, setFailureMessage] = useState('')

  const sharingPossible = fileExportClient.canShare(
    albumsShareFile(albums.albums, clock()),
  )

  function saveData() {
    const file = albumsDownloadFile(albums.albums, clock())
    fileExportClient.download(file)
    setFailureMessage('')
    announce(albumsSavedAnnouncement(file.name))
  }

  async function shareData() {
    const outcome = await fileExportClient.share(
      albumsShareFile(albums.albums, clock()),
    )
    if (outcome === 'shared') setFailureMessage('')
    announce(shareAnnouncement(outcome))
  }

  function showFailure(message: string) {
    setFailureMessage(message)
    announce(message)
  }

  function loadFailureMessage(error: unknown): string | null {
    if (error instanceof UnreadableAlbumsFile)
      return unreadableAlbumsFileMessage
    if (error instanceof AlbumsStorageFull) return storageFullMessage
    return null
  }

  async function loadData(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (file === undefined) return
    try {
      const merge = albums.mergeLoadedAlbums(
        albumsFromFileText(await file.text()),
      )
      setFailureMessage('')
      announce(albumsLoadedAnnouncement(merge))
    } catch (error) {
      const message = loadFailureMessage(error)
      if (message === null) throw error
      showFailure(message)
    } finally {
      input.value = ''
      loadButton.current?.focus()
    }
  }

  return (
    <main className="page">
      <button type="button" onClick={onBack}>
        Zurück zu den Einstellungen
      </button>
      <h1 ref={heading} tabIndex={-1}>
        Daten speichern / laden
      </h1>
      <p>
        Speichern legt eine Datei mit allen Alben und Hörzeitpunkten an. Laden
        führt eine solche Datei mit den Alben auf diesem Gerät zusammen.
      </p>
      <ul className="itemList">
        <li className="listRow">
          <button type="button" className="rowButton" onClick={saveData}>
            Daten speichern
          </button>
        </li>
        {sharingPossible && (
          <li className="listRow">
            <button
              type="button"
              className="rowButton"
              onClick={() => void shareData()}
            >
              Daten teilen
            </button>
          </li>
        )}
        <li className="listRow">
          <button
            type="button"
            className="rowButton"
            ref={loadButton}
            onClick={() => fileInput.current?.click()}
          >
            Daten laden
          </button>
        </li>
      </ul>
      <input
        ref={fileInput}
        type="file"
        accept=".json,.txt,application/json,text/plain"
        className="visuallyHidden"
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Datei mit Album-Daten"
        onChange={(event) => void loadData(event)}
      />
      <p className="failure">{failureMessage}</p>
    </main>
  )
}
