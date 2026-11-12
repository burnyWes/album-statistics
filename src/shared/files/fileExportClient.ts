export type ExportFile = { name: string; mimeType: string; text: string }

export type ShareOutcome = 'shared' | 'dismissed' | 'failed'

export interface FileExportClient {
  download(file: ExportFile): void
  canShare(file: ExportFile): boolean
  share(file: ExportFile): Promise<ShareOutcome>
}
