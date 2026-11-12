import { useState } from 'react'
import type { AlbumOrderClient } from '../api/albumOrderClient'
import type { AlbumOrder } from '../domain/albumOrder'

export type ChosenAlbumOrder = {
  order: AlbumOrder
  changeOrder: (wanted: AlbumOrder) => void
}

export function useAlbumOrder(client: AlbumOrderClient): ChosenAlbumOrder {
  const [order, setOrder] = useState(() => client.readAlbumOrder())

  function changeOrder(wanted: AlbumOrder) {
    client.writeAlbumOrder(wanted)
    setOrder(wanted)
  }

  return { order, changeOrder }
}
