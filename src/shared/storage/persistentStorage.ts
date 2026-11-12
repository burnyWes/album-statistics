export async function requestPersistentStorage(
  storage: Pick<StorageManager, 'persist'> | undefined = navigator.storage,
): Promise<void> {
  try {
    await storage?.persist?.()
  } catch {
    return
  }
}
