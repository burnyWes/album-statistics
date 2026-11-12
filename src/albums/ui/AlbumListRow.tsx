import { albumName, type Album } from '../domain/album'

export function AlbumListRow({ album }: { album: Album }) {
  return (
    <li className="listRow">
      <button type="button" className="rowButton">
        {albumName(album)}
      </button>
    </li>
  )
}
