import { describe, expect, it } from 'vitest'
import {
  createBrowserFileExportClient,
  type FileExportEnvironment,
} from './browserFileExportClient'
import type { ExportFile } from './fileExportClient'

const backup: ExportFile = {
  name: 'album-statistics-2026-11-15.txt',
  mimeType: 'text/plain',
  text: '{"version":1,"albums":[]}',
}

type ClickedLink = { href: string; download: string; attached: boolean }

function documentWatchingClicks() {
  const attachedLinks = new Set<object>()
  const clickedLinks: ClickedLink[] = []
  const document = {
    createElement() {
      const link = {
        href: '',
        download: '',
        click() {
          clickedLinks.push({
            href: link.href,
            download: link.download,
            attached: attachedLinks.has(link),
          })
        },
        remove() {
          attachedLinks.delete(link)
        },
      }
      return link
    },
    body: {
      append(link: object) {
        attachedLinks.add(link)
      },
    },
  }
  return {
    document: document as unknown as FileExportEnvironment['document'],
    attachedLinks,
    clickedLinks,
  }
}

function addressBook() {
  const revokedAddresses: string[] = []
  const URL = {
    createObjectURL: () => 'blob:backup',
    revokeObjectURL: (address: string) => {
      revokedAddresses.push(address)
    },
  }
  return { URL, revokedAddresses }
}

function environmentWith(
  navigator: FileExportEnvironment['navigator'] = {},
): FileExportEnvironment {
  return {
    document: documentWatchingClicks().document,
    navigator,
    URL: addressBook().URL,
  }
}

function sharingNavigator(share: () => Promise<void>) {
  const offeredFiles: File[] = []
  const navigator: FileExportEnvironment['navigator'] = {
    canShare: (data) => {
      offeredFiles.push(...(data?.files ?? []))
      return true
    },
    share,
  }
  return { navigator, offeredFiles }
}

describe('browserFileExportClient', () => {
  it('downloads a file through a temporary link', () => {
    const { document, attachedLinks, clickedLinks } = documentWatchingClicks()
    const { URL, revokedAddresses } = addressBook()
    const client = createBrowserFileExportClient({
      document,
      navigator: {},
      URL,
    })

    client.download(backup)

    expect(clickedLinks).toEqual([
      { href: 'blob:backup', download: backup.name, attached: true },
    ])
    expect(revokedAddresses).toEqual(['blob:backup'])
    expect(attachedLinks.size).toBe(0)
  })

  it('can share a file the browser accepts', () => {
    const { navigator, offeredFiles } = sharingNavigator(async () => {})

    expect(
      createBrowserFileExportClient(environmentWith(navigator)).canShare(
        backup,
      ),
    ).toBe(true)
    expect(offeredFiles.map(({ name, type }) => ({ name, type }))).toEqual([
      { name: backup.name, type: 'text/plain' },
    ])
  })

  it('cannot share without the share api', () => {
    expect(
      createBrowserFileExportClient(environmentWith({})).canShare(backup),
    ).toBe(false)
  })

  it('reports a shared file', async () => {
    const { navigator } = sharingNavigator(async () => {})

    expect(
      await createBrowserFileExportClient(environmentWith(navigator)).share(
        backup,
      ),
    ).toBe('shared')
  })

  it('reports a dismissed share', async () => {
    const { navigator } = sharingNavigator(async () => {
      throw new DOMException('Share canceled', 'AbortError')
    })

    expect(
      await createBrowserFileExportClient(environmentWith(navigator)).share(
        backup,
      ),
    ).toBe('dismissed')
  })

  it('reports a failed share', async () => {
    const { navigator } = sharingNavigator(async () => {
      throw new DOMException('Permission denied', 'NotAllowedError')
    })

    expect(
      await createBrowserFileExportClient(environmentWith(navigator)).share(
        backup,
      ),
    ).toBe('failed')
  })

  it('reports a failed share without the share api', async () => {
    expect(
      await createBrowserFileExportClient(environmentWith({})).share(backup),
    ).toBe('failed')
  })
})
