import { brandText } from '../brand/instance'
import type { CatalogData } from './catalog'

/** Puts the shop's own name wherever the catalog texts use the placeholder name. Ids and filters stay unchanged. */
export const withBrandName = (data: CatalogData): CatalogData => ({
  ...data,
  brands: data.brands.map((b) => ({ ...b, name: brandText(b.name) })),
  banners: data.banners.map((b) => ({ ...b, title: brandText(b.title), subtitle: brandText(b.subtitle) })),
})
