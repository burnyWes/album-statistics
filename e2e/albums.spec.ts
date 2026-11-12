import { expect, test, type Locator, type Page } from '@playwright/test'

async function addAlbum(page: Page, title: string, artist: string) {
  await page.getByRole('button', { name: 'Album hinzufügen' }).click()
  await page.getByRole('textbox', { name: 'Albumname' }).fill(title)
  await page.getByRole('textbox', { name: 'Bandname (optional)' }).fill(artist)
  await page.getByRole('button', { name: 'Speichern' }).click()
}

function albumButton(page: Page, name: string) {
  return page.getByRole('button', { name: `${name}. Diesen Monat` })
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

  await albumButton(page, 'Kind of Blue, Miles Davis').click()
  await page.getByRole('button', { name: 'Bearbeiten' }).click()
  await page.getByRole('textbox', { name: 'Albumname' }).fill('Blue Train')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Blue Train, Miles Davis' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Bearbeiten' }).click()
  await page.getByRole('button', { name: 'Löschen' }).click()
  await expect(
    page.getByRole('heading', { name: 'Blue Train, Miles Davis löschen?' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Löschen' }).click()

  await expect(page.getByText('Noch keine Alben.')).toBeVisible()

  await page.reload()

  await expect(page.getByText('Noch keine Alben.')).toBeVisible()
})

test('keeps listenings and taking one back after a reload', async ({
  page,
}) => {
  await page.goto('./')
  await addAlbum(page, 'Kind of Blue', 'Miles Davis')
  const listened = page.getByRole('button', {
    name: 'Kind of Blue, Miles Davis gehört',
  })

  await listened.click()
  await listened.click()
  await page
    .getByRole('button', { name: 'Rückgängig: Kind of Blue, Miles Davis' })
    .click()

  await page.reload()

  await expect(
    albumButton(page, 'Kind of Blue, Miles Davis'),
  ).toHaveAccessibleName(/insgesamt 1 Mal gehört/)
})

test('shows listenings on the album details after a reload', async ({
  page,
}) => {
  await page.goto('./')
  await addAlbum(page, 'Kind of Blue', 'Miles Davis')
  await page
    .getByRole('button', { name: 'Kind of Blue, Miles Davis gehört' })
    .click()

  await page.reload()
  await albumButton(page, 'Kind of Blue, Miles Davis').click()

  await expect(
    page.getByRole('heading', { level: 2, name: 'Gehört, 1 Mal' }),
  ).toBeVisible()
})

test('deletes a single listening for good', async ({ page }) => {
  await page.goto('./')
  await addAlbum(page, 'Kind of Blue', 'Miles Davis')
  const listened = page.getByRole('button', {
    name: 'Kind of Blue, Miles Davis gehört',
  })
  await listened.click()
  await listened.click()

  await albumButton(page, 'Kind of Blue, Miles Davis').click()
  await page
    .getByRole('button', { name: /^Hören vom .* löschen$/ })
    .first()
    .click()
  await page.getByRole('button', { name: 'Löschen' }).click()
  await expect(
    page.getByRole('heading', { level: 2, name: 'Gehört, 1 Mal' }),
  ).toBeFocused()

  await page.reload()

  await expect(
    albumButton(page, 'Kind of Blue, Miles Davis'),
  ).toHaveAccessibleName(/insgesamt 1 Mal gehört/)
})

test('keeps a spotify link after a reload', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Album hinzufügen' }).click()
  await page.getByRole('textbox', { name: 'Albumname' }).fill('Kind of Blue')
  await page
    .getByRole('textbox', { name: 'Spotify-Link (optional)' })
    .fill('open.spotify.com/album/1weenld61qoidwYuZ1GESA')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await page.reload()
  await albumButton(page, 'Kind of Blue').click()

  await expect(
    page.getByRole('link', { name: 'Auf Spotify öffnen' }),
  ).toHaveAttribute(
    'href',
    'https://open.spotify.com/album/1weenld61qoidwYuZ1GESA',
  )
})

async function cornerPixel(image: Locator) {
  return image.evaluate((element: HTMLImageElement) => {
    const canvas = document.createElement('canvas')
    canvas.width = element.naturalWidth
    canvas.height = element.naturalHeight
    const context = canvas.getContext('2d')!
    context.drawImage(element, 0, 0)
    return [...context.getImageData(1, 1, 1, 1).data]
  })
}

async function expectShrunkenCover(image: Locator) {
  await expect(image).toHaveAttribute('src', /^data:image\/jpeg;base64,/)
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth),
    )
    .toBe(256)
  const [red, green, blue] = await cornerPixel(image)
  expect(Math.min(red, green, blue)).toBeGreaterThan(240)
}

test('keeps a shrunken cover after a reload', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Album hinzufügen' }).click()
  await page.getByRole('textbox', { name: 'Albumname' }).fill('Kind of Blue')
  const fileChooserOpened = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Cover wählen' }).click()
  await (await fileChooserOpened).setFiles('public/icon-192.png')
  await expect(page.getByRole('status')).toContainText('Cover gewählt.')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await page.reload()

  await expectShrunkenCover(
    albumButton(page, 'Kind of Blue').locator('img.albumCoverThumbnail'),
  )
  await albumButton(page, 'Kind of Blue').click()
  await expectShrunkenCover(page.getByRole('img', { name: 'Album-Cover' }))
})

test('orders the albums by listenings in total', async ({ page }) => {
  await page.goto('./')
  await addAlbum(page, 'Abbey Road', 'The Beatles')
  await addAlbum(page, 'Kind of Blue', 'Miles Davis')
  await page
    .getByRole('button', { name: 'Kind of Blue, Miles Davis gehört' })
    .click()
  const inTotal = page.getByRole('button', {
    name: 'Insgesamt am meisten gehört',
  })

  await inTotal.click()

  await expect(inTotal).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.albumName').first()).toHaveText(
    'Kind of Blue, Miles Davis',
  )
})

test('keeps the chosen order after a reload', async ({ page }) => {
  await page.goto('./')
  await addAlbum(page, 'Abbey Road', 'The Beatles')
  await addAlbum(page, 'Kind of Blue', 'Miles Davis')
  await page
    .getByRole('button', { name: 'Kind of Blue, Miles Davis gehört' })
    .click()
  const inTotal = page.getByRole('button', {
    name: 'Insgesamt am meisten gehört',
  })
  await inTotal.click()

  await page.reload()

  await expect(inTotal).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.albumName').first()).toHaveText(
    'Kind of Blue, Miles Davis',
  )
})
