const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600

function durationParts(totalSeconds: number) {
  return {
    hours: Math.floor(totalSeconds / SECONDS_PER_HOUR),
    minutes: Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE),
    seconds: totalSeconds % SECONDS_PER_MINUTE,
  }
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

export function clockDuration(totalSeconds: number): string {
  const { hours, minutes, seconds } = durationParts(totalSeconds)
  return `${hours}:${twoDigits(minutes)}:${twoDigits(seconds)}`
}

function spokenPart(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`
}

export function spokenDuration(totalSeconds: number): string {
  if (totalSeconds === 0) return spokenPart(0, 'Sekunde', 'Sekunden')
  const { hours, minutes, seconds } = durationParts(totalSeconds)
  const parts = [
    ...(hours > 0 ? [spokenPart(hours, 'Stunde', 'Stunden')] : []),
    ...(minutes > 0 ? [spokenPart(minutes, 'Minute', 'Minuten')] : []),
    ...(seconds > 0 ? [spokenPart(seconds, 'Sekunde', 'Sekunden')] : []),
  ]
  return parts.join(', ')
}
