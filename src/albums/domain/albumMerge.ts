import {
  isSameAlbum,
  type Album,
  type AlbumId,
  type Listening,
  type NamedAlbum,
  type NewAlbum,
} from './album'
import { isListening } from './listening'

export type LoadedAlbum = NewAlbum & { listenings: readonly Listening[] }

export type AlbumsMerge = {
  albums: Album[]
  addedAlbums: number
  extendedAlbums: number
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

function withTrimmedName<Named extends NamedAlbum>(album: Named): Named {
  return {
    ...album,
    title: album.title.trim(),
    artist: album.artist.trim(),
  }
}

function completedWith(album: Album, loaded: LoadedAlbum): Album {
  return {
    ...album,
    spotifyLink: album.spotifyLink ?? loaded.spotifyLink,
    cover: album.cover ?? loaded.cover,
    listenings: [
      ...album.listenings,
      ...listeningsMissingIn(album.listenings, loaded.listenings),
    ],
  }
}

function hasChanged(album: Album, completed: Album): boolean {
  return (
    completed.listenings.length !== album.listenings.length ||
    completed.spotifyLink !== album.spotifyLink ||
    completed.cover !== album.cover
  )
}

export function mergeAlbums(
  present: readonly Album[],
  loaded: readonly LoadedAlbum[],
  createAlbumId: () => AlbumId,
): AlbumsMerge {
  const albums = [...present]
  const extendedPositions = new Set<number>()
  let addedAlbums = 0

  for (const loadedAlbum of loaded) {
    const incoming = withTrimmedName(loadedAlbum)
    let position = albums.findIndex((album) => isSameAlbum(album, incoming))
    if (position === -1) {
      albums.push({ ...incoming, id: createAlbumId(), listenings: [] })
      position = albums.length - 1
      addedAlbums += 1
    }
    const album = albums[position]
    const completed = completedWith(album, incoming)
    if (!hasChanged(album, completed)) continue
    albums[position] = completed
    if (position < present.length) extendedPositions.add(position)
  }

  return {
    albums,
    addedAlbums,
    extendedAlbums: extendedPositions.size,
  }
}
