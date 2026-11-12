export type InstallOutcome = 'accepted' | 'dismissed'

export interface InstallOfferClient {
  observeOffer(onOfferChanged: (available: boolean) => void): () => void
  install(): Promise<InstallOutcome>
}
