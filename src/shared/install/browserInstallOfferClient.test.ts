import { describe, expect, it } from 'vitest'
import type { InstallOutcome } from './installOfferClient'
import { createBrowserInstallOfferClient } from './browserInstallOfferClient'

function installPromptAnswering(outcome: InstallOutcome) {
  const prompts: string[] = []
  const event = Object.assign(new Event('beforeinstallprompt'), {
    prompt: async () => {
      prompts.push('prompted')
    },
    userChoice: Promise.resolve({ outcome }),
  })
  return { event, prompts }
}

function observedOffers(browser: EventTarget) {
  const client = createBrowserInstallOfferClient(browser)
  const offers: boolean[] = []
  const stopObserving = client.observeOffer((available) =>
    offers.push(available),
  )
  return { client, offers, stopObserving }
}

describe('browserInstallOfferClient', () => {
  it('reports the offer of the browser', () => {
    const browser = new EventTarget()
    const { offers } = observedOffers(browser)

    browser.dispatchEvent(installPromptAnswering('accepted').event)

    expect(offers).toEqual([true])
  })

  it('reports an offer made before anyone observed it', () => {
    const browser = new EventTarget()
    const client = createBrowserInstallOfferClient(browser)
    browser.dispatchEvent(installPromptAnswering('accepted').event)
    const offers: boolean[] = []

    client.observeOffer((available) => offers.push(available))

    expect(offers).toEqual([true])
  })

  it('installs with an accepted prompt and withdraws the offer', async () => {
    const browser = new EventTarget()
    const { client, offers } = observedOffers(browser)
    const { event, prompts } = installPromptAnswering('accepted')
    browser.dispatchEvent(event)

    const outcome = await client.install()

    expect(prompts).toEqual(['prompted'])
    expect(outcome).toBe('accepted')
    expect(offers).toEqual([true, false])
  })

  it('reports a dismissed prompt and withdraws the offer', async () => {
    const browser = new EventTarget()
    const { client, offers } = observedOffers(browser)
    browser.dispatchEvent(installPromptAnswering('dismissed').event)

    const outcome = await client.install()

    expect(outcome).toBe('dismissed')
    expect(offers).toEqual([true, false])
  })

  it('withdraws the offer once the app is installed', () => {
    const browser = new EventTarget()
    const { offers } = observedOffers(browser)
    browser.dispatchEvent(installPromptAnswering('accepted').event)

    browser.dispatchEvent(new Event('appinstalled'))

    expect(offers).toEqual([true, false])
  })

  it('stays silent after observing stopped', () => {
    const browser = new EventTarget()
    const { offers, stopObserving } = observedOffers(browser)

    stopObserving()
    browser.dispatchEvent(installPromptAnswering('accepted').event)

    expect(offers).toEqual([])
  })
})
