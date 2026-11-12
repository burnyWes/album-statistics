import type {
  ExportFile,
  FileExportClient,
  ShareOutcome,
} from './fileExportClient'

export type InMemoryFileExportClient = FileExportClient & {
  downloadedFiles(): readonly ExportFile[]
  sharedFiles(): readonly ExportFile[]
}

export function createInMemoryFileExportClient({
  shareable = false,
  shareOutcome = 'shared',
}: {
  shareable?: boolean
  shareOutcome?: ShareOutcome
} = {}): InMemoryFileExportClient {
  const downloaded: ExportFile[] = []
  const shared: ExportFile[] = []

  return {
    download: (file) => {
      downloaded.push(file)
    },
    canShare: () => shareable,
    share: async (file) => {
      shared.push(file)
      return shareOutcome
    },
    downloadedFiles: () => [...downloaded],
    sharedFiles: () => [...shared],
  }
}
