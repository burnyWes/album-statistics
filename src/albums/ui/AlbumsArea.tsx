import { useState, type ReactNode } from 'react'
import type { AlbumsClient } from '../api/albumsClient'
import type { NewAlbum } from '../domain/album'
import { albumSavedAnnouncement } from '../domain/albumAnnouncements'
import { AlbumFormPage } from './AlbumFormPage'
import { AlbumListPage } from './AlbumListPage'
import { useAlbums } from './useAlbums'

type AlbumsPage = { kind: 'list' } | { kind: 'form' }

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

  function showList() {
    setPage({ kind: 'list' })
  }

  function saveAlbum(newAlbum: NewAlbum) {
    albums.addAlbum(newAlbum)
    showList()
    announce(albumSavedAnnouncement(newAlbum))
  }

  if (page.kind === 'form') {
    return (
      <AlbumFormPage
        otherAlbums={albums.albums}
        onSave={saveAlbum}
        onBack={showList}
        announce={announce}
      />
    )
  }

  return (
    <AlbumListPage
      navigation={navigation}
      albums={albums.albums}
      onAddAlbum={() => setPage({ kind: 'form' })}
    />
  )
}
