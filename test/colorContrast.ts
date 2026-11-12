const LINEAR_SEGMENT_LIMIT = 0.04045

function channelLuminance(channel: number): number {
  const fraction = channel / 255
  return fraction <= LINEAR_SEGMENT_LIMIT
    ? fraction / 12.92
    : ((fraction + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hexColor: string): number {
  const [red, green, blue] = [1, 3, 5].map((start) =>
    channelLuminance(Number.parseInt(hexColor.slice(start, start + 2), 16)),
  )
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function contrastRatio(foreground: string, background: string): number {
  const [lighter, darker] = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((first, second) => second - first)
  return (lighter + 0.05) / (darker + 0.05)
}
