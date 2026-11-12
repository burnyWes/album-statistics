export type DeviceStorage = Pick<Storage, 'getItem' | 'setItem'>

export function deviceStorage(): DeviceStorage | null {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}
