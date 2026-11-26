import { useEffect, useSyncExternalStore } from 'react'
import { applyBrand } from './theme'
import type { BrandStore } from './store'
import { brandStore } from './instance'

export const useBrand = (store: BrandStore = brandStore) => useSyncExternalStore(store.subscribe, store.get, store.get)

/** Keeps the document in step with the brand (also when another tab changes it). Renders nothing. */
export function BrandTheme({ store = brandStore }: { store?: BrandStore }) {
  const brand = useBrand(store)
  useEffect(() => applyBrand(brand), [brand])
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === store.key) store.refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [store])
  return null
}
