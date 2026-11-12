import type { Listening } from '../domain/album'
import {
  shortListeningTime,
  spokenListeningTime,
} from '../domain/listeningTime'

export function ListeningTime({ listening }: { listening: Listening }) {
  return (
    <>
      <span aria-hidden="true">{shortListeningTime(listening)}</span>
      <span className="visuallyHidden">{spokenListeningTime(listening)}</span>
    </>
  )
}
