import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'

async function addAlbum(page: Page, title: string, artist: string) {
  await page.getByRole('button', { name: 'Album hinzufügen' }).click()
  await page.getByRole('textbox', { name: 'Albumname' }).fill(title)
  await page.getByRole('textbox', { name: 'Bandname (optional)' }).fill(artist)
  await page.getByRole('button', { name: 'Speichern' }).click()
}

async function openBackup(page: Page) {
  await page.getByRole('button', { name: 'Einstellungen' }).click()
  await page.getByRole('button', { name: 'Daten speichern und laden' }).click()
}

async function downloadBackup(page: Page) {
  const downloadStarted = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Daten speichern' }).click()
  return downloadStarted
}

test('downloads the albums as a file', async ({ page }) => {
  await page.goto('./')
  await addAlbum(page, 'Kind of Blue', 'Miles Davis')
  await openBackup(page)

  const download = await downloadBackup(page)

  expect(download.suggestedFilename()).toMatch(
    /^album-statistics-\d{4}-\d{2}-\d{2}\.json$/,
  )
  const content = JSON.parse(await readFile(await download.path(), 'utf-8'))
  expect(content.version).toBe(1)
  expect(content.albums).toEqual([
    expect.objectContaining({ title: 'Kind of Blue', artist: 'Miles Davis' }),
  ])
})

test('brings saved albums back after loading the file', async ({ page }) => {
  await page.goto('./')
  await addAlbum(page, 'Kind of Blue', 'Miles Davis')
  await page
    .getByRole('button', { name: 'Kind of Blue, Miles Davis gehört' })
    .click()
  await openBackup(page)
  const download = await downloadBackup(page)
  const savedFile = await download.path()

  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByText('Noch keine Alben.')).toBeVisible()

  await openBackup(page)
  const fileChooserOpened = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Daten laden' }).click()
  await (await fileChooserOpened).setFiles(savedFile)

  await expect(page.getByRole('status')).toContainText('1 Album neu')
  const albumRow = page.getByRole('button', {
    name: 'Kind of Blue, Miles Davis. Diesen Monat',
  })
  await page
    .getByRole('button', { name: 'Zurück zu den Einstellungen' })
    .click()
  await page.getByRole('button', { name: 'Alben' }).click()
  await expect(albumRow).toHaveAccessibleName(/insgesamt 1 Mal gehört/)

  await page.reload()

  await expect(albumRow).toHaveAccessibleName(/insgesamt 1 Mal gehört/)
})
