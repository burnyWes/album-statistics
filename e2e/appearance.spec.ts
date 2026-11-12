import { expect, test, type Page } from '@playwright/test'

function invertedColorsSwitch(page: Page) {
  return page.getByRole('switch', { name: 'Farben invertieren' })
}

test('remembers the inverted colours after a reload', async ({ page }) => {
  await page.goto('./')

  await page.getByRole('button', { name: 'Einstellungen' }).click()
  await invertedColorsSwitch(page).focus()
  await page.keyboard.press('Space')

  await expect(page.locator('html')).toHaveAttribute(
    'data-inverted-colors',
    'true',
  )

  await page.reload()

  await expect(page.locator('html')).toHaveAttribute(
    'data-inverted-colors',
    'true',
  )

  await page.getByRole('button', { name: 'Einstellungen' }).click()

  await expect(invertedColorsSwitch(page)).toBeChecked()
})
