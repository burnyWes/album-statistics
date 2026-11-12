import { useState, type ReactNode } from 'react'
import type { AlbumOrderClient } from '../api/albumOrderClient'
import { AlbumsStorageFull, type AlbumsClient } from '../api/albumsClient'
import type { CoverImageClient } from '../api/coverImageClient'
import type { Album, AlbumId, Listening, NewAlbum } from '../domain/album'
import {
  albumDeletedAnnouncement,
  albumOrderChangedAnnouncement,
  albumSavedAnnouncement,
  listenedAnnouncement,
  listeningDeletedAnnouncement,
  listeningTakenBackAnnouncement,
  storageFullMessage,
  undoListeningLabel,
} from '../domain/albumAnnouncements'
import { withListening, withoutListening } from '../domain/listening'
import { inOrder, type AlbumOrder } from '../domain/albumOrder'
import { AlbumDetailPage, type AlbumDetailFocus } from './AlbumDetailPage'
import { AlbumFormPage } from './AlbumFormPage'
import {
  AlbumListPage,
  type ListenButtonFocusRequest,
  type UndoListening,
} from './AlbumListPage'
import { DeleteAlbumPage } from './DeleteAlbumPage'
import { DeleteListeningPage } from './DeleteListeningPage'
import { useAlbumOrder } from './useAlbumOrder'
import { useAlbums } from './useAlbums'

type AlbumsPage =
  | { kind: 'list'; focusedAlbum: AlbumId | null }
  | { kind: 'detail'; id: AlbumId; focus: AlbumDetailFocus }
  | { kind: 'form'; id: AlbumId | null }
  | { kind: 'delete'; id: AlbumId }
  | { kind: 'deleteListening'; id: AlbumId; listening: Listening }

type LastListening = { albumId: AlbumId; listening: Listening }

type AlbumsAreaProps = {
  albumsClient: AlbumsClient
  albumOrderClient: AlbumOrderClient
  coverImageClient: CoverImageClient
  clock: () => Date
  announce: (text: string) => void
  navigation: ReactNode
}

export function AlbumsArea({
  albumsClient,
  albumOrderClient,
  coverImageClient,
  clock,
  announce,
  navigation,
}: AlbumsAreaProps) {
  const albums = useAlbums(albumsClient, clock)
  const [page, setPage] = useState<AlbumsPage>({
    kind: 'list',
    focusedAlbum: null,
  })
  const [lastListening, setLastListening] = useState<LastListening | null>(null)
  const [listenButtonFocusRequest, setListenButtonFocusRequest] =
    useState<ListenButtonFocusRequest | null>(null)
  const albumOrder = useAlbumOrder(albumOrderClient)

  const addressedAlbum =
    page.kind === 'list' || page.id === null
      ? null
      : (albums.albums.find((album) => album.id === page.id) ?? null)

  const lastListenedAlbum =
    lastListening === null
      ? null
      : (albums.albums.find((album) => album.id === lastListening.albumId) ??
        null)

  function showPage(next: AlbumsPage) {
    setPage(next)
    setLastListening(null)
    setListenButtonFocusRequest(null)
  }

  function showList() {
    showPage({ kind: 'list', focusedAlbum: null })
  }

  function showAlbum(id: AlbumId) {
    showPage({ kind: 'detail', id, focus: 'album' })
  }

  function editAlbum(id: AlbumId) {
    showPage({ kind: 'form', id })
  }

  function saveAlbum(editedId: AlbumId | null, newAlbum: NewAlbum) {
    if (editedId === null) {
      albums.addAlbum(newAlbum)
      showList()
    } else {
      albums.changeAlbum(editedId, newAlbum)
      showAlbum(editedId)
    }
    announce(albumSavedAnnouncement(newAlbum))
  }

  function deleteAlbum(album: Album) {
    albums.removeAlbum(album.id)
    showList()
    announce(albumDeletedAnnouncement(album, albums.albums.length - 1))
  }

  function listeningRecordedFor(album: Album): Listening | null {
    try {
      const listening = albums.listenTo(album.id)
      announce(listenedAnnouncement(withListening(album, listening), clock()))
      return listening
    } catch (error) {
      if (!(error instanceof AlbumsStorageFull)) throw error
      announce(storageFullMessage)
      return null
    }
  }

  function requestListenButtonFocus(albumId: AlbumId) {
    setListenButtonFocusRequest((previous) => ({
      albumId,
      request: (previous?.request ?? 0) + 1,
    }))
  }

  function listenTo(album: Album) {
    const listening = listeningRecordedFor(album)
    if (listening === null) return
    setLastListening({ albumId: album.id, listening })
    requestListenButtonFocus(album.id)
  }

  function listenFromDetails(album: Album) {
    listeningRecordedFor(album)
  }

  function deleteListening(album: Album, listening: Listening) {
    albums.takeBackListening(album.id, listening)
    showPage({ kind: 'detail', id: album.id, focus: 'listenings' })
    announce(
      listeningDeletedAnnouncement(
        withoutListening(album, listening),
        listening,
        clock(),
      ),
    )
  }

  function takeBackListening(album: Album, listening: Listening) {
    albums.takeBackListening(album.id, listening)
    setLastListening(null)
    requestListenButtonFocus(album.id)
    announce(
      listeningTakenBackAnnouncement(
        withoutListening(album, listening),
        clock(),
      ),
    )
  }

  function changeOrder(wanted: AlbumOrder) {
    albumOrder.changeOrder(wanted)
    announce(
      albumOrderChangedAnnouncement(
        wanted,
        inOrder(albums.albums, wanted, clock())[0],
      ),
    )
  }

  const undoListening: UndoListening | null =
    lastListening === null || lastListenedAlbum === null
      ? null
      : {
          label: undoListeningLabel(lastListenedAlbum),
          onUndo: () =>
            takeBackListening(lastListenedAlbum, lastListening.listening),
        }

  if (page.kind === 'form' && (page.id === null || addressedAlbum !== null)) {
    const editedId = page.id
    return (
      <AlbumFormPage
        editedAlbum={addressedAlbum}
        otherAlbums={albums.albums.filter((album) => album.id !== editedId)}
        coverImageClient={coverImageClient}
        onSave={(newAlbum) => saveAlbum(editedId, newAlbum)}
        onDelete={() => {
          if (editedId !== null) showPage({ kind: 'delete', id: editedId })
        }}
        onBack={() => (editedId === null ? showList() : showAlbum(editedId))}
        announce={announce}
      />
    )
  }

  if (page.kind === 'detail' && addressedAlbum !== null) {
    return (
      <AlbumDetailPage
        album={addressedAlbum}
        now={clock()}
        focus={page.focus}
        onBack={() =>
          showPage({ kind: 'list', focusedAlbum: addressedAlbum.id })
        }
        onListen={() => listenFromDetails(addressedAlbum)}
        onEdit={() => editAlbum(addressedAlbum.id)}
        onDeleteListening={(listening) =>
          showPage({
            kind: 'deleteListening',
            id: addressedAlbum.id,
            listening,
          })
        }
      />
    )
  }

  if (page.kind === 'deleteListening' && addressedAlbum !== null) {
    return (
      <DeleteListeningPage
        album={addressedAlbum}
        listening={page.listening}
        onDelete={() => deleteListening(addressedAlbum, page.listening)}
        onCancel={() => showAlbum(addressedAlbum.id)}
      />
    )
  }

  if (page.kind === 'delete' && addressedAlbum !== null) {
    return (
      <DeleteAlbumPage
        album={addressedAlbum}
        onDelete={() => deleteAlbum(addressedAlbum)}
        onCancel={() => editAlbum(addressedAlbum.id)}
      />
    )
  }

  return (
    <AlbumListPage
      navigation={navigation}
      albums={inOrder(albums.albums, albumOrder.order, clock())}
      now={clock()}
      order={albumOrder.order}
      focusedAlbum={page.kind === 'list' ? page.focusedAlbum : null}
      undoListening={undoListening}
      listenButtonFocusRequest={listenButtonFocusRequest}
      onAddAlbum={() => showPage({ kind: 'form', id: null })}
      onOpenAlbum={(album) => showAlbum(album.id)}
      onListen={listenTo}
      onChangeOrder={changeOrder}
    />
  )
}
