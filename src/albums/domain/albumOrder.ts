import { byTitle, compareByTitle, type Album } from './album'
import { listeningsInTotal, listeningsThisMonth } from './listening'

export const ALBUM_ORDERS = ['alphabetical', 'thisMonth', 'inTotal'] as const

export type AlbumOrder = (typeof ALBUM_ORDERS)[number]

export const DEFAULT_ALBUM_ORDER: AlbumOrder = 'alphabetical'

export function isAlbumOrder(text: string): text is AlbumOrder {
  return (ALBUM_ORDERS as readonly string[]).includes(text)
}

function mostListenedFirst(count: (album: Album) => number) {
  return (one: Album, other: Album) =>
    count(other) - count(one) || compareByTitle(one, other)
}

export function inOrder(
  albums: readonly Album[],
  order: AlbumOrder,
  now: Date,
): Album[] {
  switch (order) {
    case 'alphabetical':
      return byTitle(albums)
    case 'thisMonth':
      return [...albums].sort(
        mostListenedFirst((album) => listeningsThisMonth(album, now)),
      )
    case 'inTotal':
      return [...albums].sort(mostListenedFirst(listeningsInTotal))
  }
}
