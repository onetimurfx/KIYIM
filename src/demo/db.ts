/**
 * The demo "database": one JSON document kept in this browser's localStorage.
 * Nothing leaves the device. The whole demo (catalog, stock, orders, pickup orders, customers, settings) lives here,
 * so everything the visitor does in the shop shows up in the demo admin panel and the other way round.
 */
import { buildSeed } from './seed'

export interface DVariant { id: string; size: string; colorName: string; colorHex: string; sku: string | null; active: boolean; quantity: number; reserved: number }
export interface DImage { id: string; path: string; sortOrder: number }
export interface DProduct {
  id: string; name: string; brandId: string; categoryId: string; description: string; price: number; oldPrice: number | null
  type: 'original' | 'other'; isNew: boolean; active: boolean; isSample: boolean; popularity: number; createdAt: string
  variants: DVariant[]; images: DImage[]
}
export interface DCategory { id: string; name: string; sortOrder: number; active: boolean }
export interface DBrand { id: string; name: string; type: 'original' | 'other'; active: boolean }
export interface DOutfit { id: string; title: string; note: string; productIds: string[] }
export interface DBanner { id: string; title: string; subtitle: string; to: string; tone: 'coral' | 'navy' | 'beige' }
export interface DItem { productId: string; name: string; brand: string; categoryId: string; size: string; color: string; colorHex: string; qty: number; unitPrice: number }
export interface DStatusEvent { status: string; by: number | null; note: string | null; at: string }
export interface DOrder {
  id: string; orderNumber: string; status: string; customerId: string; createdAt: string
  contact: { name: string; phone: string; address: string; comment: string }
  subtotal: number; deliveryFee: number | null; deliveryPending: boolean; total: number; items: DItem[]; history: DStatusEvent[]
}
export interface DPickupEvent { kind: string; status: string; actorRole: string; actorTelegramId: number | null; amount: number | null; note: string | null; at: string }
export interface DPickup {
  id: string; orderNumber: string; status: string; customerId: string; createdAt: string
  pendingExpiresAt: string | null; readyAt: string | null; readyExpiresAt: string | null; completedAt: string | null
  closedAt: string | null; closedReason: string | null; closeNote: string | null
  contact: { name: string; phone: string; comment: string }
  items: DItem[]; subtotal: number; total: number; paid: boolean; paidAt: string | null; pickupCode: string | null; history: DPickupEvent[]
}
export interface DCustomer { id: string; telegramId: number; name: string; username: string | null; phone: string | null; createdAt: string; lastSeenAt: string | null }
export interface DSettings {
  deliveryFee: number | null; deliveryFreeFrom: number | null; allowSampleOrders: boolean; supportContact: string | null
  pickup: { pendingTimeoutMinutes: number; readyHoldHours: number; maxActivePerCustomer: number; maxLines: number; storeAddress: string | null; storePhone: string | null; storeHours: string | null }
}
export interface DemoDb {
  v: 1
  seededAt: number
  categories: DCategory[]; brands: DBrand[]; products: DProduct[]; outfits: DOutfit[]; banners: DBanner[]
  customers: DCustomer[]; orders: DOrder[]; pickups: DPickup[]
  settings: DSettings
  seq: { order: number; pickup: number }
  /** idempotency key -> order id (a repeated submit returns the same order) */
  idem: Record<string, string>
  /** the visitor of this device */
  selfId: string
}

export const DB_KEY = 'kiyim:demo-db'
export const ADMIN_KEY = 'kiyim:demo-admin'
export const IMG_PREFIX = 'kiyim:demo-img:'

const store = (): Storage | null => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

let memory: DemoDb | null = null

function valid(x: unknown): x is DemoDb {
  const d = x as Partial<DemoDb> | null
  return !!d && d.v === 1 && Array.isArray(d.products) && Array.isArray(d.orders) && Array.isArray(d.pickups) && Array.isArray(d.customers) && !!d.settings && !!d.seq && !!d.idem
}

/** Reads the demo database (seeds it on the first run, or if the saved copy is unreadable). */
export function loadDb(): DemoDb {
  const s = store()
  if (s) {
    try {
      const raw = s.getItem(DB_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (valid(parsed)) return parsed
      }
    } catch {
      /* fall through: reseed */
    }
  } else if (memory) {
    return memory
  }
  const fresh = buildSeed(Date.now())
  saveDb(fresh)
  return fresh
}

/** Saves the demo database. Without usable storage (private mode) it stays in memory for this session. */
export function saveDb(db: DemoDb): void {
  memory = db
  const s = store()
  if (!s) return
  try {
    s.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    /* storage full or blocked: the in-memory copy keeps the session working */
  }
}

/** Runs `fn` on a fresh copy of the database and saves the result. */
export function mutate<T>(fn: (db: DemoDb) => T): T {
  const db = loadDb()
  const out = fn(db)
  saveDb(db)
  return out
}

/** Back to the starting data: catalog, stock, orders, customers and the uploaded photos. The cart and recent views are cleared too. */
export function resetDemo(): void {
  memory = null
  const s = store()
  if (!s) return
  try {
    const drop: string[] = []
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i)
      if (k && k.startsWith('kiyim:')) drop.push(k)
    }
    drop.forEach((k) => s.removeItem(k))
  } catch {
    /* nothing more to do */
  }
}

export const isDemoAdmin = (): boolean => {
  try {
    return store()?.getItem(ADMIN_KEY) === '1'
  } catch {
    return false
  }
}
export const setDemoAdmin = (on: boolean): void => {
  try {
    if (on) store()?.setItem(ADMIN_KEY, '1')
    else store()?.removeItem(ADMIN_KEY)
  } catch {
    /* ignore */
  }
}

export function uuid(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  const b = new Uint8Array(16)
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(b)
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
