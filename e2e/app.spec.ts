import { expect, test } from '@playwright/test'

test('shows the application once opened', async ({ page }) => {
  await page.goto('./')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Album-Statistics' }),
  ).toBeVisible()
})
