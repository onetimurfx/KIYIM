/**
 * Brand module: identity (name, logo, colours, glass style) of one tenant. No dependency on the shop's catalogue or
 * orders, so it can move into a shared core.
 */
export * from './types'
export { DEFAULT_BRAND, NAME_MAX, PRESETS } from './defaults'
export { createBrandStore, sanitizeBrand, type BrandStore, type KeyValue } from './store'
export { applyBrand, themeVars, faviconFor } from './theme'
export { readLogo, LogoError, LOGO_ACCEPT } from './logo'
export { brandStore, brandText } from './instance'
export { useBrand, BrandTheme } from './react'
export { BrandMark } from './BrandMark'
export { BrandSettings } from './BrandSettings'
