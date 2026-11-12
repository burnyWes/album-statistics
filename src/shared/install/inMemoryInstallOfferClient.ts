import type { InstallOfferClient, InstallOutcome } from './installOfferClient'

export type OfferingInstallOfferClient = InstallOfferClient & {
  offer(): void
  withdraw(): void
}

export function createInMemoryInstallOfferClient(
  outcome: InstallOutcome = 'accepted',
): OfferingInstallOfferClient {
  const listeners = new Set<(available: boolean) => void>()
  let available = false

  function report(nowAvailable: boolean) {
    available = nowAvailable
    listeners.forEach((listener) => listener(available))
  }

  return {
    observeOffer(onOfferChanged) {
      listeners.add(onOfferChanged)
      if (available) onOfferChanged(true)
      return () => listeners.delete(onOfferChanged)
    },
    async install() {
      report(false)
      return outcome
    },
    offer: () => report(true),
    withdraw: () => report(false),
  }
}
