import { useEffect, useState } from 'react'
import type { InstallOfferClient, InstallOutcome } from './installOfferClient'

export type InstallOffer = {
  available: boolean
  install: () => Promise<InstallOutcome>
}

export function useInstallOffer(
  installOfferClient: InstallOfferClient,
): InstallOffer {
  const [available, setAvailable] = useState(false)

  useEffect(
    () => installOfferClient.observeOffer(setAvailable),
    [installOfferClient],
  )

  return { available, install: () => installOfferClient.install() }
}
