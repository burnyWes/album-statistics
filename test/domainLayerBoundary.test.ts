import { ESLint } from 'eslint'
import { describe, expect, it, vi } from 'vitest'

const ESLINT_CONFIGURATION_COLD_START = 30_000

vi.setConfig({ testTimeout: ESLINT_CONFIGURATION_COLD_START })

const albumsDomainFilePath = 'src/albums/domain/boundaryProbe.ts'
const albumsApiFilePath = 'src/albums/api/boundaryProbe.ts'
const albumsUiFilePath = 'src/albums/ui/boundaryProbe.ts'
const sharedDomainFilePath = 'src/shared/domain/boundaryProbe.ts'
const sharedUiFilePath = 'src/shared/ui/boundaryProbe.ts'

async function brokenRulesFor(source: string, filePath: string) {
  const [result] = await new ESLint().lintText(source, { filePath })
  return result.messages.map((message) => message.ruleId)
}

function importOf(module: string) {
  return `import { probe } from '${module}'\nexport const reexported = probe\n`
}

const reactImport = `import { useState } from 'react'\nexport const probe = useState\n`

describe('domain layer boundary', () => {
  it('rejects a framework import inside domain', async () => {
    const brokenRules = await brokenRulesFor(reactImport, albumsDomainFilePath)

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects reaching into the api from domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../api/albumsClient'),
      albumsDomainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects reaching into the user interface from domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../ui/useAlbums'),
      albumsDomainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects the shared user interface inside domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../shared/ui/announcement'),
      albumsDomainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('allows the shared domain inside domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../shared/domain/clock'),
      albumsDomainFilePath,
    )

    expect(brokenRules).not.toContain('no-restricted-imports')
  })

  it('allows a framework import outside domain', async () => {
    const brokenRules = await brokenRulesFor(reactImport, albumsUiFilePath)

    expect(brokenRules).not.toContain('no-restricted-imports')
  })
})

describe('api layer boundary', () => {
  it('rejects the user interface inside api', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../ui/useAlbums'),
      albumsApiFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('allows the domain inside api', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../domain/album'),
      albumsApiFilePath,
    )

    expect(brokenRules).not.toContain('no-restricted-imports')
  })
})

describe('bounded context boundary', () => {
  it('rejects a context inside the shared domain', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../albums/domain/album'),
      sharedDomainFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })

  it('rejects a context inside the shared user interface', async () => {
    const brokenRules = await brokenRulesFor(
      importOf('../../albums/ui/AlbumsArea'),
      sharedUiFilePath,
    )

    expect(brokenRules).toContain('no-restricted-imports')
  })
})
