import type { Album, Listening } from './album'

export function listeningAt(moment: Date): Listening {
  return moment.toISOString()
}

export function withListening(album: Album, listening: Listening): Album {
  return { ...album, listenings: [...album.listenings, listening] }
}

export function withoutListening(album: Album, listening: Listening): Album {
  const position = album.listenings.indexOf(listening)
  if (position === -1) return album
  return {
    ...album,
    listenings: album.listenings.filter((_, at) => at !== position),
  }
}

function isInMonthOf(listening: Listening, now: Date): boolean {
  const moment = new Date(listening)
  return (
    moment.getFullYear() === now.getFullYear() &&
    moment.getMonth() === now.getMonth()
  )
}

export function listeningsThisMonth(album: Album, now: Date): number {
  return album.listenings.filter((listening) => isInMonthOf(listening, now))
    .length
}

export function listeningsInTotal(album: Album): number {
  return album.listenings.length
}
