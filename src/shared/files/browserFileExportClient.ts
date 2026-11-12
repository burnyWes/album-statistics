import type {
  ExportFile,
  FileExportClient,
  ShareOutcome,
} from './fileExportClient'

export type FileExportEnvironment = {
  document: Pick<Document, 'createElement' | 'body'>
  navigator: Partial<Pick<Navigator, 'canShare' | 'share'>>
  URL: Pick<typeof URL, 'createObjectURL' | 'revokeObjectURL'>
}

function asFile(file: ExportFile): File {
  return new File([file.text], file.name, { type: file.mimeType })
}

function isDismissal(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

export function createBrowserFileExportClient(
  environment: FileExportEnvironment = { document, navigator, URL },
): FileExportClient {
  return {
    download(file) {
      const address = environment.URL.createObjectURL(
        new Blob([file.text], { type: file.mimeType }),
      )
      const link = environment.document.createElement('a')
      link.href = address
      link.download = file.name
      environment.document.body.append(link)
      link.click()
      link.remove()
      environment.URL.revokeObjectURL(address)
    },
    canShare(file) {
      return (
        environment.navigator.canShare?.({ files: [asFile(file)] }) ?? false
      )
    },
    async share(file): Promise<ShareOutcome> {
      if (environment.navigator.share === undefined) return 'failed'
      try {
        await environment.navigator.share({ files: [asFile(file)] })
        return 'shared'
      } catch (error) {
        return isDismissal(error) ? 'dismissed' : 'failed'
      }
    },
  }
}
