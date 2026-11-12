import { useState, type ReactNode } from 'react'
import type { AlbumsClient } from '../api/albumsClient'
import type { Album, AlbumId, NewAlbum } from '../domain/album'
import {
  albumDeletedAnnouncement,
  albumSavedAnnouncement,
} from '../domain/albumAnnouncements'
import { AlbumFormPage } from './AlbumFormPage'
import { AlbumListPage } from './AlbumListPage'
import { DeleteAlbumPage } from './DeleteAlbumPage'
import { useAlbums } from './useAlbums'

type AlbumsPage =
  | { kind: 'list' }
  | { kind: 'form'; id: AlbumId | null }
  | { kind: 'delete'; id: AlbumId }

type AlbumsAreaProps = {
  albumsClient: AlbumsClient
  clock: () => Date
  announce: (text: string) => void
  navigation: ReactNode
}

export function AlbumsArea({
  albumsClient,
  announce,
  navigation,
}: AlbumsAreaProps) {
  const albums = useAlbums(albumsClient)
  const [page, setPage] = useState<AlbumsPage>({ kind: 'list' })

  const addressedAlbum =
    page.kind === 'list' || page.id === null
      ? null
      : (albums.albums.find((album) => album.id === page.id) ?? null)

  function showList() {
    setPage({ kind: 'list' })
  }

  function editAlbum(id: AlbumId) {
    setPage({ kind: 'form', id })
  }

  function saveAlbum(editedId: AlbumId | null, newAlbum: NewAlbum) {
    if (editedId === null) {
      albums.addAlbum(newAlbum)
    } else {
      albums.changeAlbum(editedId, newAlbum)
    }
    showList()
    announce(albumSavedAnnouncement(newAlbum))
  }

  function deleteAlbum(album: Album) {
    albums.removeAlbum(album.id)
    showList()
    announce(albumDeletedAnnouncement(album, albums.albums.length - 1))
  }

  if (page.kind === 'form' && (page.id === null || addressedAlbum !== null)) {
    const editedId = page.id
    return (
      <AlbumFormPage
        editedAlbum={addressedAlbum}
        otherAlbums={albums.albums.filter((album) => album.id !== editedId)}
        onSave={(newAlbum) => saveAlbum(editedId, newAlbum)}
        onDelete={() => {
          if (editedId !== null) setPage({ kind: 'delete', id: editedId })
        }}
        onBack={showList}
        announce={announce}
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
      albums={albums.albums}
      onAddAlbum={() => setPage({ kind: 'form', id: null })}
      onOpenAlbum={(album) => editAlbum(album.id)}
    />
  )
}
