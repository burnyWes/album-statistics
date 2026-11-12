import type { Cover } from '../domain/cover'
import { UnreadableCoverImage, type CoverImageClient } from './coverImageClient'

export const TEST_COVER: Cover = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='

export type InMemoryCoverImageClient = CoverImageClient & {
  holdBack(): void
  deliver(): void
}

function coverOf(file: File): Promise<Cover> {
  return file.name.startsWith('unreadable')
    ? Promise.reject(new UnreadableCoverImage())
    : Promise.resolve(TEST_COVER)
}

export function createInMemoryCoverImageClient(): InMemoryCoverImageClient {
  let heldBack = false
  const pendingDeliveries: (() => void)[] = []

  return {
    coverFromFile: (file) => {
      if (!heldBack) return coverOf(file)
      return new Promise((resolve) =>
        pendingDeliveries.push(() => resolve(coverOf(file))),
      )
    },
    holdBack: () => {
      heldBack = true
    },
    deliver: () => {
      heldBack = false
      pendingDeliveries.splice(0).forEach((deliver) => deliver())
    },
  }
}
