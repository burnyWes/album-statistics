import { useState } from 'react'
import type { AlbumsClient } from '../api/albumsClient'
import {
  byTitle,
  type Album,
  type AlbumId,
  type NewAlbum,
} from '../domain/album'

export type Albums = {
  albums: readonly Album[]
  addAlbum: (album: NewAlbum) => Album
  changeAlbum: (id: AlbumId, album: NewAlbum) => void
  removeAlbum: (id: AlbumId) => void
}

export function useAlbums(client: AlbumsClient): Albums {
  const [knownAlbums, setKnownAlbums] = useState(() => client.readAlbums())

  function store(albums: readonly Album[]) {
    client.writeAlbums(albums)
    setKnownAlbums(albums)
  }

  function addAlbum(newAlbum: NewAlbum): Album {
    const album: Album = {
      ...newAlbum,
      id: client.createAlbumId(),
      listenings: [],
    }
    store([...knownAlbums, album])
    return album
  }

  function changeAlbum(id: AlbumId, changed: NewAlbum) {
    store(
      knownAlbums.map((album) =>
        album.id === id ? { ...album, ...changed } : album,
      ),
    )
  }

  function removeAlbum(id: AlbumId) {
    store(knownAlbums.filter((album) => album.id !== id))
  }

  return { albums: byTitle(knownAlbums), addAlbum, changeAlbum, removeAlbum }
}
