import type { Listening } from './album'

const timeParts = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
} as const

const shortFormat = new Intl.DateTimeFormat('de', {
  ...timeParts,
  weekday: 'short',
})

const spokenFormat = new Intl.DateTimeFormat('de', {
  ...timeParts,
  weekday: 'long',
})

export function shortListeningTime(listening: Listening): string {
  return shortFormat.format(new Date(listening))
}

export function spokenListeningTime(listening: Listening): string {
  return spokenFormat.format(new Date(listening))
}
