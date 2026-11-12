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

function newerFirst(one: Listening, other: Listening): number {
  return Date.parse(other) - Date.parse(one)
}

export function listeningsNewestFirst(album: Album): Listening[] {
  return [...album.listenings].sort(newerFirst)
}

export function lastListening(album: Album): Listening | null {
  return listeningsNewestFirst(album)[0] ?? null
}

export type ListeningMonth = {
  year: number
  monthIndex: number
  listenings: Listening[]
}

function isSameMonth(month: ListeningMonth, moment: Date): boolean {
  return (
    month.year === moment.getFullYear() &&
    month.monthIndex === moment.getMonth()
  )
}

export function listeningMonthsNewestFirst(album: Album): ListeningMonth[] {
  const months: ListeningMonth[] = []
  for (const listening of listeningsNewestFirst(album)) {
    const moment = new Date(listening)
    const currentMonth = months.at(-1)
    if (currentMonth !== undefined && isSameMonth(currentMonth, moment)) {
      currentMonth.listenings.push(listening)
    } else {
      months.push({
        year: moment.getFullYear(),
        monthIndex: moment.getMonth(),
        listenings: [listening],
      })
    }
  }
  return months
}
