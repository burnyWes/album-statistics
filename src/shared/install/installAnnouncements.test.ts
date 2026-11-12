import { describe, expect, it } from 'vitest'
import { installOutcomeAnnouncement } from './installAnnouncements'

describe('installOutcomeAnnouncement', () => {
  it('tells where an accepted installation appears', () => {
    expect(installOutcomeAnnouncement('accepted')).toBe(
      'Album-Statistics wird installiert und erscheint auf dem Startbildschirm.',
    )
  })

  it('tells how to install after dismissing', () => {
    expect(installOutcomeAnnouncement('dismissed')).toBe(
      'Installation abgebrochen. Über das Browsermenü und „App installieren“ geht es jederzeit.',
    )
  })
})
