/**
 * Tenant-aware brand storage. The host app picks the namespace and tenant id; the storage is injectable, so a future
 * multi-tenant core can swap localStorage for an API without touching the UI.
 */
import { normalizeHex } from './color'
import { DEFAULT_BRAND, NAME_MAX } from './defaults'
import { MAX_DATA_URL } from './logo'
import type { BrandConfig, BrandLogo } from './types'

export type KeyValue = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export interface BrandStore {
  readonly key: string
  get(): BrandConfig
  /** applies the change at once; returns false when it could not be saved (storage full or blocked) */
  update(patch: Partial<Omit<BrandConfig, 'v'>>): boolean
  reset(): void
  subscribe(listener: () => void): () => void
  /** re-reads storage (another tab changed it) */
  refresh(): void
}

const LOGO_SRC = /^data:image\/(png|webp|svg\+xml);base64,[A-Za-z0-9+/]+=*$/

function cleanLogo(raw: unknown): BrandLogo | null {
  const l = raw as Partial<BrandLogo> | null
  if (!l || typeof l.src !== 'string' || l.src.length > MAX_DATA_URL || !LOGO_SRC.test(l.src)) return null
  const ok = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0
  return ok(l.width) && ok(l.height) ? { src: l.src, width: l.width, height: l.height } : null
}

export const cleanName = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null
  const name = [...raw.replace(/\s+/g, ' ').trim()].slice(0, NAME_MAX).join('').trim()
  return name || null
}

/** Untrusted input -> a complete, valid brand. Every bad field falls back on its own. */
export function sanitizeBrand(raw: unknown, base: BrandConfig = DEFAULT_BRAND): BrandConfig {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Record<keyof BrandConfig, unknown>>
  return {
    v: 1,
    name: cleanName(r.name) ?? base.name,
    logo: r.logo === null ? null : r.logo === undefined ? base.logo : cleanLogo(r.logo),
    showName: typeof r.showName === 'boolean' ? r.showName : base.showName,
    primary: normalizeHex(r.primary) ?? base.primary,
    secondary: normalizeHex(r.secondary) ?? base.secondary,
    nameColor: normalizeHex(r.nameColor) ?? base.nameColor,
    glass: r.glass === 'clear' || r.glass === 'balanced' || r.glass === 'solid' ? r.glass : base.glass,
    backdrop: r.backdrop === 'aurora' || r.backdrop === 'plain' ? r.backdrop : base.backdrop,
  }
}

export interface BrandStoreOptions {
  namespace: string
  tenantId: string
  storage?: () => KeyValue | null
  defaults?: BrandConfig
}

const browserStorage = (): KeyValue | null => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function createBrandStore({ namespace, tenantId, storage = browserStorage, defaults = DEFAULT_BRAND }: BrandStoreOptions): BrandStore {
  const key = `${namespace}:brand:${tenantId}`
  const listeners = new Set<() => void>()
  const read = (): BrandConfig => {
    try {
      const raw = storage()?.getItem(key)
      return raw ? sanitizeBrand(JSON.parse(raw), defaults) : defaults
    } catch {
      return defaults
    }
  }
  let current = read()
  const emit = () => listeners.forEach((l) => l())
  return {
    key,
    get: () => current,
    update(patch) {
      current = sanitizeBrand({ ...current, ...patch }, current)
      let saved = false
      try {
        const s = storage()
        if (s) {
          s.setItem(key, JSON.stringify(current))
          saved = true
        }
      } catch {
        /* stays applied for this session */
      }
      emit()
      return saved
    },
    reset() {
      current = defaults
      try {
        storage()?.removeItem(key)
      } catch {
        /* nothing to remove */
      }
      emit()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    refresh() {
      current = read()
      emit()
    },
  }
}
