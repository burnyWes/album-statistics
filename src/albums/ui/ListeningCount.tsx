import { Duration } from './Duration'

type ListeningCountProps = { count: number; duration: number | null }

export function ListeningCount({ count, duration }: ListeningCountProps) {
  if (duration === null) return <>{count}</>
  return (
    <span className="listeningCount">
      {count} × <Duration seconds={duration} />
    </span>
  )
}
