/** Small colour maths so that ANY brand colour a shop picks stays readable. */
export function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(v)) return `#${[...v].map((c) => c + c).join('')}`.toUpperCase()
  return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v}`.toUpperCase() : null
}

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

export function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1..21 */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

/** `amount` 0 = a, 1 = b */
export function mix(a: string, b: string, amount: number): string {
  const [x, y] = [rgb(a), rgb(b)]
  return `#${x.map((c, i) => Math.round(c + (y[i] - c) * amount).toString(16).padStart(2, '0')).join('')}`.toUpperCase()
}

export const INK = '#14202B'

/** Text colour on a filled button of colour `bg`: white while it is clearly legible, otherwise dark ink. */
export const onColor = (bg: string): string => (contrast('#FFFFFF', bg) >= 3.2 || contrast('#FFFFFF', bg) >= contrast(INK, bg) ? '#FFFFFF' : INK)

/** the darkest light surface of the app: what text and controls have to stand out from */
export const SURFACE = '#EEEAE4'

/** below this a filled control (or a selection ring) is hard to tell apart from the background */
export const MIN_FILL_CONTRAST = 2
/** the large bold wordmark only warns when it practically disappears */
export const MIN_NAME_CONTRAST = 1.35

export const isWeakFill = (color: string): boolean => contrast(color, SURFACE) < MIN_FILL_CONTRAST
export const isWeakName = (color: string): boolean => contrast(color, SURFACE) < MIN_NAME_CONTRAST

/** Darkens `color` just enough to reach `min` contrast on a light surface. */
export function readableOn(color: string, surface: string, min = 4.5): string {
  for (let step = 0; step <= 20; step++) {
    const c = mix(color, '#000000', step / 20)
    if (contrast(c, surface) >= min) return c
  }
  return INK
}
