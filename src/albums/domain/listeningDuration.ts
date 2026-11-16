import type { Album } from './album'
import { listeningsInTotal, listeningsThisMonth } from './listening'

function timesPlayingTime(album: Album, listenings: number): number | null {
  return album.playingTime === null ? null : listenings * album.playingTime
}

export function listeningDurationThisMonth(
  album: Album,
  now: Date,
): number | null {
  return timesPlayingTime(album, listeningsThisMonth(album, now))
}

export function listeningDurationInTotal(album: Album): number | null {
  return timesPlayingTime(album, listeningsInTotal(album))
}

export type ListeningDurations = {
  thisMonth: number
  inTotal: number
  albumsWithoutPlayingTime: number
}

export function listeningDurationsOfAll(
  albums: readonly Album[],
  now: Date,
): ListeningDurations {
  return albums.reduce<ListeningDurations>(
    (sum, album) => ({
      thisMonth: sum.thisMonth + (listeningDurationThisMonth(album, now) ?? 0),
      inTotal: sum.inTotal + (listeningDurationInTotal(album) ?? 0),
      albumsWithoutPlayingTime:
        sum.albumsWithoutPlayingTime + (album.playingTime === null ? 1 : 0),
    }),
    { thisMonth: 0, inTotal: 0, albumsWithoutPlayingTime: 0 },
  )
}
