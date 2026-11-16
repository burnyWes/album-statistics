export type PlayingTime = number

export type ParsedPlayingTime =
  { valid: true; playingTime: PlayingTime | null } | { valid: false }

const MINUTES_WITH_OPTIONAL_SECONDS = /^(\d+)(?::(\d{1,2}))?$/
const SECONDS_PER_MINUTE = 60

export function parsePlayingTime(raw: string): ParsedPlayingTime {
  const text = raw.trim()
  if (text === '') return { valid: true, playingTime: null }
  const match = MINUTES_WITH_OPTIONAL_SECONDS.exec(text)
  if (match === null) return { valid: false }
  const minutes = Number(match[1])
  const seconds = Number(match[2] ?? 0)
  if (seconds >= SECONDS_PER_MINUTE) return { valid: false }
  const playingTime = minutes * SECONDS_PER_MINUTE + seconds
  if (!isPlayingTime(playingTime)) return { valid: false }
  return { valid: true, playingTime }
}

export function isPlayingTime(value: unknown): value is PlayingTime {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

export function playingTimeInput(playingTime: PlayingTime | null): string {
  if (playingTime === null) return ''
  const minutes = Math.floor(playingTime / SECONDS_PER_MINUTE)
  const seconds = playingTime % SECONDS_PER_MINUTE
  if (seconds === 0) return String(minutes)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
