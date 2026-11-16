import { clockDuration, spokenDuration } from '../domain/duration'

export function Duration({ seconds }: { seconds: number }) {
  return (
    <>
      <span aria-hidden="true">{clockDuration(seconds)}</span>
      <span className="visuallyHidden">{spokenDuration(seconds)}</span>
    </>
  )
}
