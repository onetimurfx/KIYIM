/** Turns a brand into CSS variables (see src/index.css) plus the page title and icon. */
import { mix, onColor, readableOn } from './color'
import { DEFAULT_BRAND } from './defaults'
import type { BrandConfig } from './types'

/** the darkest light surface text can sit on */
const SURFACE = '#EEEAE4'

export function themeVars(b: BrandConfig): Record<string, string> {
  const soft = mix(b.primary, '#FFFFFF', 0.84)
  return {
    '--brand-primary': b.primary,
    '--brand-primary-ink': readableOn(b.primary, SURFACE, 4),
    '--brand-primary-deep': readableOn(b.primary, soft, 5),
    '--brand-primary-soft': soft,
    '--brand-on-primary': onColor(b.primary),
    '--brand-secondary': b.secondary,
    '--brand-on-secondary': onColor(b.secondary),
    '--brand-name': b.nameColor,
  }
}

const escapeXml = (s: string) => s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`)

/** Browser-tab icon: the logo, else the first letter of the name. */
export function faviconFor(b: BrandConfig): string {
  if (b.logo) return b.logo.src
  const letter = escapeXml([...b.name][0]?.toUpperCase() ?? 'B')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><text x="32" y="50" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="56" font-weight="800" fill="${b.nameColor}">${letter}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export function applyBrand(b: BrandConfig, doc: Document = document) {
  const root = doc.documentElement
  for (const [k, v] of Object.entries(themeVars(b))) root.style.setProperty(k, v)
  root.dataset.glass = b.glass
  root.dataset.backdrop = b.backdrop
  doc.title = b.name
  const icon = doc.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (icon) {
    const original = (icon.dataset.original ??= icon.getAttribute('href') ?? '')
    const untouched = !b.logo && b.name === DEFAULT_BRAND.name && b.nameColor === DEFAULT_BRAND.nameColor
    const href = untouched ? original : faviconFor(b)
    icon.removeAttribute('type') // may now be a PNG or WebP logo
    icon.setAttribute('href', href)
  }
}
