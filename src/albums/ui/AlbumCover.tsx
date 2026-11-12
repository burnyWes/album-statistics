import type { Cover } from '../domain/cover'
import { RecordIcon } from './RecordIcon'

export function AlbumCoverThumbnail({ cover }: { cover: Cover | null }) {
  if (cover === null) {
    return (
      <span
        className="albumCoverThumbnail albumCoverPlaceholder"
        aria-hidden="true"
      >
        <RecordIcon />
      </span>
    )
  }
  return <img className="albumCoverThumbnail" src={cover} alt="" />
}

export function AlbumDetailCover({ cover }: { cover: Cover | null }) {
  if (cover === null) return null
  return <img className="albumDetailCover" src={cover} alt="Album-Cover" />
}
