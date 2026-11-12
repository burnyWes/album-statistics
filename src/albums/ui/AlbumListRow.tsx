import { albumName, type Album } from '../domain/album'

type AlbumListRowProps = {
  album: Album
  onOpenAlbum: (album: Album) => void
}

export function AlbumListRow({ album, onOpenAlbum }: AlbumListRowProps) {
  return (
    <li className="listRow">
      <button
        type="button"
        className="rowButton"
        onClick={() => onOpenAlbum(album)}
      >
        {albumName(album)}
      </button>
    </li>
  )
}
