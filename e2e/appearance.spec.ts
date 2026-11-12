import { expect, test, type Page } from '@playwright/test'

function invertedColorsCheckbox(page: Page) {
  return page.getByRole('checkbox', { name: 'Farben invertieren' })
}

function invertedButtonsCheckbox(page: Page) {
  return page.getByRole('checkbox', { name: 'Nur Buttons invertieren' })
}

test('remembers the inverted colours after a reload', async ({ page }) => {
  await page.goto('./')

  await page.getByRole('button', { name: 'Einstellungen' }).click()
  await invertedColorsCheckbox(page).focus()
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

  await expect(invertedColorsCheckbox(page)).toBeChecked()
})

test('remembers the inverted buttons after a reload', async ({ page }) => {
  await page.goto('./')

  await page.getByRole('button', { name: 'Einstellungen' }).click()
  await invertedButtonsCheckbox(page).click()

  await page.reload()

  await expect(page.locator('html')).toHaveAttribute(
    'data-inverted-buttons',
    'true',
  )
  await expect(page.locator('html')).toHaveAttribute(
    'data-inverted-colors',
    'false',
  )

  await page.getByRole('button', { name: 'Einstellungen' }).click()

  await expect(invertedButtonsCheckbox(page)).toBeChecked()
  await expect(invertedColorsCheckbox(page)).not.toBeChecked()
})
