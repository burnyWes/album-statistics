import { useState } from 'react'
import type { AlbumsClient } from '../api/albumsClient'
import { byTitle, type Album, type NewAlbum } from '../domain/album'

export type Albums = {
  albums: readonly Album[]
  addAlbum: (album: NewAlbum) => Album
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

  return { albums: byTitle(knownAlbums), addAlbum }
}
