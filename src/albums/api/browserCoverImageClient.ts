import type { Cover } from '../domain/cover'
import { UnreadableCoverImage, type CoverImageClient } from './coverImageClient'

const COVER_SIZE = 256
const COVER_QUALITY = 0.8
const BACKGROUND_FOR_TRANSPARENCY = '#ffffff'

type Square = { left: number; top: number; side: number }

function centredSquareOf(image: ImageBitmap): Square {
  const side = Math.min(image.width, image.height)
  return {
    left: (image.width - side) / 2,
    top: (image.height - side) / 2,
    side,
  }
}

function drawnCover(image: ImageBitmap): Cover {
  const canvas = document.createElement('canvas')
  canvas.width = COVER_SIZE
  canvas.height = COVER_SIZE
  const context = canvas.getContext('2d')
  if (context === null) throw new UnreadableCoverImage()
  context.fillStyle = BACKGROUND_FOR_TRANSPARENCY
  context.fillRect(0, 0, COVER_SIZE, COVER_SIZE)
  context.imageSmoothingQuality = 'high'
  const square = centredSquareOf(image)
  context.drawImage(
    image,
    square.left,
    square.top,
    square.side,
    square.side,
    0,
    0,
    COVER_SIZE,
    COVER_SIZE,
  )
  return canvas.toDataURL('image/jpeg', COVER_QUALITY)
}

async function coverFromFile(file: File): Promise<Cover> {
  try {
    const image = await createImageBitmap(file, {
      imageOrientation: 'from-image',
    })
    try {
      return drawnCover(image)
    } finally {
      image.close()
    }
  } catch {
    throw new UnreadableCoverImage()
  }
}

export function createBrowserCoverImageClient(): CoverImageClient {
  return { coverFromFile }
}
