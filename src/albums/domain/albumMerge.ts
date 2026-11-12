import {
  isSameAlbum,
  type Album,
  type AlbumId,
  type Listening,
  type NewAlbum,
} from './album'
import { isListening } from './listening'

export type LoadedAlbum = NewAlbum & { listenings: readonly Listening[] }

export type AlbumsMerge = {
  albums: Album[]
  addedAlbums: number
  extendedAlbums: number
  addedListenings: number
}

export function isLoadableAlbum(album: LoadedAlbum): boolean {
  return album.title.trim() !== '' && album.listenings.every(isListening)
}

function moment(listening: Listening): number {
  return Date.parse(listening)
}

function countsByMoment(listenings: readonly Listening[]): Map<number, number> {
  const counts = new Map<number, number>()
  for (const listening of listenings) {
    counts.set(moment(listening), (counts.get(moment(listening)) ?? 0) + 1)
  }
  return counts
}

function listeningsMissingIn(
  present: readonly Listening[],
  loaded: readonly Listening[],
): Listening[] {
  const unmatchedPresent = countsByMoment(present)
  const missing: Listening[] = []
  for (const listening of loaded) {
    const unmatched = unmatchedPresent.get(moment(listening)) ?? 0
    if (unmatched > 0) unmatchedPresent.set(moment(listening), unmatched - 1)
    else missing.push(listening)
  }
  return missing
}

function trimmedName(album: NewAlbum): NewAlbum {
  return { title: album.title.trim(), artist: album.artist.trim() }
}

export function mergeAlbums(
  present: readonly Album[],
  loaded: readonly LoadedAlbum[],
  createAlbumId: () => AlbumId,
): AlbumsMerge {
  const albums = [...present]
  const extendedPositions = new Set<number>()
  let addedAlbums = 0
  let addedListenings = 0

  for (const loadedAlbum of loaded) {
    const name = trimmedName(loadedAlbum)
    let position = albums.findIndex((album) => isSameAlbum(album, name))
    if (position === -1) {
      albums.push({ ...name, id: createAlbumId(), listenings: [] })
      position = albums.length - 1
      addedAlbums += 1
    }
    const album = albums[position]
    const missing = listeningsMissingIn(
      album.listenings,
      loadedAlbum.listenings,
    )
    if (missing.length === 0) continue
    albums[position] = {
      ...album,
      listenings: [...album.listenings, ...missing],
    }
    if (position < present.length) {
      extendedPositions.add(position)
      addedListenings += missing.length
    }
  }

  return {
    albums,
    addedAlbums,
    extendedAlbums: extendedPositions.size,
    addedListenings,
  }
}
