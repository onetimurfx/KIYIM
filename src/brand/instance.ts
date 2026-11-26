/** This app's tenant. A multi-tenant host would build one store per tenant instead. */
import { DEFAULT_BRAND } from './defaults'
import { createBrandStore } from './store'

export const brandStore = createBrandStore({ namespace: 'kiyim', tenantId: 'brend' })

/** Replaces the placeholder name inside interface texts and demo data with the shop's own name. */
export const brandText = (text: string): string => text.replaceAll(DEFAULT_BRAND.name, () => brandStore.get().name)
