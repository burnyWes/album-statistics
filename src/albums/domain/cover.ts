export type Cover = string

const COVER_DATA_URL = /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/

export function isCover(value: unknown): value is Cover {
  return typeof value === 'string' && COVER_DATA_URL.test(value)
}
