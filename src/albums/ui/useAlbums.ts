import { useState } from 'react'
import type { AlbumsClient } from '../api/albumsClient'
import {
  byTitle,
  type Album,
  type AlbumId,
  type Listening,
  type NewAlbum,
} from '../domain/album'
import {
  mergeAlbums,
  type AlbumsMerge,
  type LoadedAlbum,
} from '../domain/albumMerge'
import {
  listeningAt,
  withListening,
  withoutListening,
} from '../domain/listening'

export type Albums = {
  albums: readonly Album[]
  addAlbum: (album: NewAlbum) => Album
  changeAlbum: (id: AlbumId, album: NewAlbum) => void
  removeAlbum: (id: AlbumId) => void
  listenTo: (id: AlbumId) => Listening
  takeBackListening: (id: AlbumId, listening: Listening) => void
  mergeLoadedAlbums: (loaded: readonly LoadedAlbum[]) => AlbumsMerge
}

export function useAlbums(client: AlbumsClient, clock: () => Date): Albums {
  const [knownAlbums, setKnownAlbums] = useState(() => client.readAlbums())

  function store(albums: readonly Album[]) {
    client.writeAlbums(albums)
    setKnownAlbums(albums)
  }

  function storeChanged(id: AlbumId, change: (album: Album) => Album) {
    store(knownAlbums.map((album) => (album.id === id ? change(album) : album)))
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
    storeChanged(id, (album) => ({ ...album, ...changed }))
  }

  function removeAlbum(id: AlbumId) {
    store(knownAlbums.filter((album) => album.id !== id))
  }

  function listenTo(id: AlbumId): Listening {
    const listening = listeningAt(clock())
    storeChanged(id, (album) => withListening(album, listening))
    return listening
  }

  function takeBackListening(id: AlbumId, listening: Listening) {
    storeChanged(id, (album) => withoutListening(album, listening))
  }

  function mergeLoadedAlbums(loaded: readonly LoadedAlbum[]): AlbumsMerge {
    const merge = mergeAlbums(knownAlbums, loaded, client.createAlbumId)
    store(merge.albums)
    return merge
  }

  return {
    albums: byTitle(knownAlbums),
    addAlbum,
    changeAlbum,
    removeAlbum,
    listenTo,
    takeBackListening,
    mergeLoadedAlbums,
  }
}
