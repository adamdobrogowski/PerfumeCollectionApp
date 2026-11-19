const DARK_TEXT = '#1A1A1A'
const LIGHT_TEXT = '#FFFFFF'

function getLuminance(hex) {
  const [red, green, blue] = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

export function getContrast(colorA, colorB) {
  const [lighter, darker] = [getLuminance(colorA), getLuminance(colorB)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}

export function getReadableTextColor(background) {
  return getContrast(background, DARK_TEXT) >= getContrast(background, LIGHT_TEXT) ? DARK_TEXT : LIGHT_TEXT
}