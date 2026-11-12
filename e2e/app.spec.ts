import { expect, test } from '@playwright/test'

test('opens on the albums and switches to the settings', async ({ page }) => {
  await page.goto('./')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Alben' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Einstellungen' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Einstellungen' }),
  ).toBeVisible()
})
