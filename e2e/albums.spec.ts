import { expect, test, type Page } from '@playwright/test'

async function addAlbum(page: Page, title: string, artist: string) {
  await page.getByRole('button', { name: 'Album hinzufügen' }).click()
  await page.getByRole('textbox', { name: 'Albumname' }).fill(title)
  await page.getByRole('textbox', { name: 'Bandname (optional)' }).fill(artist)
  await page.getByRole('button', { name: 'Speichern' }).click()
}

test('keeps an added album after a reload', async ({ page }) => {
  await page.goto('./')

  await addAlbum(page, 'Kind of Blue', 'Miles Davis')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Alben, 1' }),
  ).toBeVisible()

  await page.reload()

  await expect(page.getByText('Kind of Blue, Miles Davis')).toBeVisible()
})

test('renames and deletes an album for good', async ({ page }) => {
  await page.goto('./')
  await addAlbum(page, 'Kind of Blue', 'Miles Davis')

  await page.getByRole('button', { name: 'Kind of Blue, Miles Davis' }).click()
  await page.getByRole('textbox', { name: 'Albumname' }).fill('Blue Train')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await page.getByRole('button', { name: 'Blue Train, Miles Davis' }).click()
  await page.getByRole('button', { name: 'Löschen' }).click()
  await expect(
    page.getByRole('heading', { name: 'Blue Train, Miles Davis löschen?' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Löschen' }).click()

  await expect(page.getByText('Noch keine Alben.')).toBeVisible()

  await page.reload()

  await expect(page.getByText('Noch keine Alben.')).toBeVisible()
})
