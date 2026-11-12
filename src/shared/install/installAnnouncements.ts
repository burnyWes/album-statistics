import type { InstallOutcome } from './installOfferClient'

const ANNOUNCEMENTS: Record<InstallOutcome, string> = {
  accepted:
    'Album-Statistics wird installiert und erscheint auf dem Startbildschirm.',
  dismissed:
    'Installation abgebrochen. Über das Browsermenü und „App installieren“ geht es jederzeit.',
}

export function installOutcomeAnnouncement(outcome: InstallOutcome): string {
  return ANNOUNCEMENTS[outcome]
}
