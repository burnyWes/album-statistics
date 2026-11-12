import type { InstallOfferClient, InstallOutcome } from './installOfferClient'

// Chromium-only event, missing from the TypeScript DOM library, see
// https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: InstallOutcome }>
}

export function createBrowserInstallOfferClient(
  browser: EventTarget = globalThis,
): InstallOfferClient {
  const listeners = new Set<(available: boolean) => void>()
  let installPrompt: BeforeInstallPromptEvent | null = null

  function keepInstallPrompt(event: Event) {
    installPrompt = event as BeforeInstallPromptEvent
    listeners.forEach((listener) => listener(true))
  }

  function forgetInstallPrompt() {
    installPrompt = null
    listeners.forEach((listener) => listener(false))
  }

  browser.addEventListener('beforeinstallprompt', keepInstallPrompt)
  browser.addEventListener('appinstalled', forgetInstallPrompt)

  return {
    observeOffer(onOfferChanged) {
      listeners.add(onOfferChanged)
      if (installPrompt !== null) onOfferChanged(true)
      return () => listeners.delete(onOfferChanged)
    },
    async install() {
      const offeredPrompt = installPrompt
      if (offeredPrompt === null) return 'dismissed'
      await offeredPrompt.prompt()
      const { outcome } = await offeredPrompt.userChoice
      forgetInstallPrompt()
      return outcome
    },
  }
}
