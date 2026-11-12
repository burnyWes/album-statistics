import type { Cover } from '../domain/cover'

export class UnreadableCoverImage extends Error {
  constructor() {
    super('unreadable cover image')
    this.name = 'UnreadableCoverImage'
  }
}

export interface CoverImageClient {
  coverFromFile(file: File): Promise<Cover>
}
