/**
 * Demo backend. It answers every call the UI makes (catalog, cart, orders, store pickup, the whole admin panel) from the
 * demo database in this browser (see ./db.ts). No network, no accounts, no payments: it only imitates a shop so the app can
 * be shown on a phone. The shapes are exactly the ones the screens were built for.
 */
import { BackendError, type AdminParams, type CartItem, type PickupPlaceRequest, type PlaceOrderRequest } from '../lib/backendTypes'
import { getTelegramUser } from '../lib/telegram'
import { isDemoAdmin, loadDb, mutate, saveDb, uuid, type DItem, type DOrder, type DPickup, type DProduct, type DVariant, type DemoDb } from './db'
import { cartNumber, pickupNumber } from './seed'

const THRESHOLD = 3
const NEXT_STATUS: Record<string, string[]> = {
  new: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'], preparing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: [], cancelled: [],
}
const ORDER_STATUSES = Object.keys(NEXT_STATUS)
const ACTIVE_PICKUP = ['pending', 'preparing', 'ready_for_pickup']
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const ADMIN_ID = 900_000_001

const HOUR = 3_600_000
const iso = (t: number) => new Date(t).toISOString()
const bad = (code: string, detail: Record<string, unknown> = {}, status = 422) => new BackendError('invalid', code, detail, status)
const conflict = (code: string, detail: Record<string, unknown> = {}) => new BackendError('conflict', code, detail, 409)
const notFound = () => new BackendError('invalid', 'NOT_FOUND', {}, 404)
const forbidden = () => new BackendError('auth', 'FORBIDDEN', {}, 403)
const dayKey = (t: number) => new Date(t + 5 * HOUR).toISOString().slice(0, 10) // Asia/Tashkent day

const str = (v: unknown, max = 500): string => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const int = (v: unknown): number | null => (typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null)
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])
const rec = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
const page = <T,>(rows: T[], p: AdminParams): T[] => {
  const offset = Math.max(0, Number(p.offset) || 0)
  const limit = Math.min(200, Math.max(1, Number(p.limit) || 30))
  return rows.slice(offset, offset + limit)
}
const has = (hay: string, q: string) => hay.toLowerCase().includes(q.toLowerCase())

const sizeRank = (s: string) => {
  const o = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].indexOf(s.toUpperCase())
  return o >= 0 ? o : Number.isFinite(Number(s)) ? 100 + Number(s) : 1000
}

// ---------------------------------------------------------------- housekeeping

/** Pickup orders that the shop did not accept / the customer did not collect in time expire by themselves (like the real cron). */
function expireOld(db: DemoDb, now: number): boolean {
  let changed = false
  for (const p of db.pickups) {
    const pendingDue = p.status === 'pending' && p.pendingExpiresAt !== null && Date.parse(p.pendingExpiresAt) < now
    const readyDue = p.status === 'ready_for_pickup' && p.readyExpiresAt !== null && Date.parse(p.readyExpiresAt) < now
    if (!pendingDue && !readyDue) continue
    release(db, p.items)
    p.status = 'expired'
    p.closedAt = iso(now)
    p.closedReason = pendingDue ? 'pending_timeout' : 'pickup_timeout'
    p.pickupCode = null
    p.history.push({ kind: 'status', status: 'expired', actorRole: 'system', actorTelegramId: null, amount: null, note: null, at: iso(now) })
    changed = true
  }
  return changed
}

/** The visitor of this device is a customer too: keep their Telegram name up to date. */
function self(db: DemoDb) {
  const c = db.customers.find((x) => x.id === db.selfId)!
  const u = getTelegramUser()
  if (u) {
    c.telegramId = u.id
    c.name = [u.first_name, u.last_name].filter(Boolean).join(' ') || c.name
    c.username = u.username ?? null
  }
  c.lastSeenAt = iso(Date.now())
  return c
}

function open(): DemoDb {
  const db = loadDb()
  if (expireOld(db, Date.now())) saveDb(db)
  return db
}

const variantOf = (p: DProduct, size: string, color: string): DVariant | undefined => p.variants.find((v) => v.active && v.size === size && v.colorName === color)
const available = (v: DVariant) => Math.max(0, v.quantity - v.reserved)
const productOf = (db: DemoDb, id: string) => db.products.find((p) => p.id === id)
const brandName = (db: DemoDb, id: string) => db.brands.find((b) => b.id === id)?.name ?? ''
const catName = (db: DemoDb, id: string) => db.categories.find((c) => c.id === id)?.name ?? ''

function release(db: DemoDb, items: DItem[]) {
  for (const i of items) {
    const v = productOf(db, i.productId)?.variants.find((x) => x.size === i.size && x.colorName === i.color)
    if (v) v.reserved = Math.max(0, v.reserved - i.qty)
  }
}
function restock(db: DemoDb, items: DItem[]) {
  for (const i of items) {
    const v = productOf(db, i.productId)?.variants.find((x) => x.size === i.size && x.colorName === i.color)
    if (v) v.quantity += i.qty
  }
}

// ---------------------------------------------------------------- customer side

const itemJson = (i: DItem) => ({ productId: i.productId, name: i.name, brand: i.brand, categoryId: i.categoryId, size: i.size, color: i.color, colorHex: i.colorHex, qty: i.qty, unitPrice: i.unitPrice })

function orderJson(o: DOrder) {
  return {
    id: o.id, orderNumber: o.orderNumber, status: o.status, source: 'cart', createdAt: o.createdAt, contact: { ...o.contact }, items: o.items.map(itemJson),
    subtotal: o.subtotal, deliveryFee: o.deliveryFee, deliveryPending: o.deliveryPending, total: o.total,
  }
}

function pickupJson(p: DPickup) {
  return {
    id: p.id, orderNumber: p.orderNumber, status: p.status, createdAt: p.createdAt, pendingExpiresAt: p.pendingExpiresAt, readyExpiresAt: p.readyExpiresAt,
    completedAt: p.completedAt, closedReason: p.closedReason, closeNote: p.closeNote, contact: { ...p.contact }, items: p.items.map(itemJson),
    subtotal: p.subtotal, total: p.total, payment: { status: p.paid ? 'paid' : 'unpaid', method: 'cash', paidAt: p.paidAt }, pickupCode: p.status === 'ready_for_pickup' ? p.pickupCode : null,
  }
}

function catalogJson(db: DemoDb) {
  const okBrand = new Set(db.brands.filter((b) => b.active).map((b) => b.id))
  const okCat = new Set(db.categories.filter((c) => c.active).map((c) => c.id))
  return {
    categories: db.categories.filter((c) => c.active).sort((a, b) => a.sortOrder - b.sortOrder).map((c) => ({ id: c.id, name: c.name })),
    brands: db.brands.filter((b) => b.active).map((b) => ({ id: b.id, name: b.name, type: b.type })),
    products: db.products
      .filter((p) => p.active && okBrand.has(p.brandId) && okCat.has(p.categoryId))
      .map((p) => ({
        id: p.id, name: p.name, brandId: p.brandId, categoryId: p.categoryId, description: p.description, price: p.price, oldPrice: p.oldPrice, type: p.type, isNew: p.isNew,
        popularity: p.popularity, createdAt: p.createdAt, sample: p.isSample,
        images: [...p.images].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.path),
        variants: p.variants.filter((v) => v.active).map((v) => ({ size: v.size, color: v.colorName, colorHex: v.colorHex, qty: available(v) })),
      })),
    outfits: db.outfits,
    banners: db.banners,
    settings: { deliveryConfigured: db.settings.deliveryFee !== null, deliveryFee: db.settings.deliveryFee, deliveryFreeFrom: db.settings.deliveryFreeFrom, supportContact: db.settings.supportContact },
  }
}

interface Line { product: DProduct; variant: DVariant; qty: number }

/** Checks the items against the catalog and stock. Throws the same errors the screens already know. */
function resolveLines(db: DemoDb, items: CartItem[]): Line[] {
  if (!Array.isArray(items) || items.length === 0) throw bad('EMPTY_ORDER')
  const lines: Line[] = []
  const issues: Record<string, unknown>[] = []
  const wanted = new Map<string, number>()
  for (const it of items) {
    const qty = Number(it.qty)
    const p = productOf(db, String(it.productId))
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw bad('INVALID_ITEM', { productId: it.productId })
    if (!p || !p.active) {
      issues.push({ productId: String(it.productId), name: p?.name ?? String(it.productId), requested: qty, available: 0, reason: 'unavailable' })
      continue
    }
    const v = variantOf(p, it.size, it.color)
    if (!v) throw bad('INVALID_ITEM', { productId: p.id })
    if (p.isSample && !db.settings.allowSampleOrders) throw conflict('SAMPLE_PRODUCT', { name: p.name })
    lines.push({ product: p, variant: v, qty })
    wanted.set(v.id, (wanted.get(v.id) ?? 0) + qty)
  }
  for (const [vid, qty] of wanted) {
    const l = lines.find((x) => x.variant.id === vid)!
    if (qty > available(l.variant)) issues.push({ productId: l.product.id, name: l.product.name, requested: qty, available: available(l.variant), reason: 'stock', size: l.variant.size, color: l.variant.colorName })
  }
  if (issues.length > 0) throw conflict('ITEMS_UNAVAILABLE', { issues })
  return lines
}

const toItems = (db: DemoDb, lines: Line[]): DItem[] =>
  lines.map((l) => ({
    productId: l.product.id, name: l.product.name, brand: brandName(db, l.product.brandId), categoryId: l.product.categoryId, size: l.variant.size,
    color: l.variant.colorName, colorHex: l.variant.colorHex, qty: l.qty, unitPrice: l.product.price,
  }))

function checkContact(c: { name?: unknown; phone?: unknown; address?: unknown; comment?: unknown }, needAddress: boolean) {
  const fields: string[] = []
  if (str(c.name, 100).length < 2) fields.push('name')
  if (!/^\+998\d{9}$/.test(str(c.phone, 20))) fields.push('phone')
  if (needAddress && str(c.address, 300).length < 5) fields.push('address')
  if (str(c.comment, 500).length > 300) fields.push('comment')
  if (fields.length > 0) throw bad('INVALID_CONTACT', { fields })
}

function placeOrder(req: PlaceOrderRequest) {
  return mutate((db) => {
    const me = self(db)
    const known = db.idem[req.idempotencyKey]
    const dup = known ? db.orders.find((o) => o.id === known) : undefined
    if (dup) return { duplicate: true, order: orderJson(dup) }
    checkContact(req.contact, true)
    const lines = resolveLines(db, req.items)
    for (const l of lines) l.variant.quantity -= l.qty
    const items = toItems(db, lines)
    const subtotal = items.reduce((s, i) => s + i.qty * i.unitPrice, 0)
    const { deliveryFee, deliveryFreeFrom } = db.settings
    const fee = deliveryFee === null ? null : deliveryFreeFrom !== null && subtotal >= deliveryFreeFrom ? 0 : deliveryFee
    const now = Date.now()
    const order: DOrder = {
      id: uuid(), orderNumber: cartNumber(now, ++db.seq.order), status: 'new', customerId: me.id, createdAt: iso(now),
      contact: { name: str(req.contact.name, 100), phone: str(req.contact.phone, 20), address: str(req.contact.address, 300), comment: str(req.contact.comment, 300) },
      subtotal, deliveryFee: fee, deliveryPending: fee === null, total: subtotal + (fee ?? 0), items, history: [{ status: 'new', by: null, note: null, at: iso(now) }],
    }
    me.phone = order.contact.phone
    db.orders.unshift(order)
    db.idem[req.idempotencyKey] = order.id
    return { duplicate: false, order: orderJson(order) }
  })
}

function pickupPlace(req: PickupPlaceRequest) {
  return mutate((db) => {
    const me = self(db)
    const known = db.idem[req.idempotencyKey]
    const dup = known ? db.pickups.find((o) => o.id === known) : undefined
    if (dup) return { duplicate: true, order: pickupJson(dup) }
    checkContact(req.contact, false)
    const s = db.settings.pickup
    if (req.items.length > s.maxLines) throw conflict('TOO_MANY_LINES', { max: s.maxLines })
    if (db.pickups.filter((p) => p.customerId === me.id && ACTIVE_PICKUP.includes(p.status)).length >= s.maxActivePerCustomer) throw conflict('ACTIVE_LIMIT', { max: s.maxActivePerCustomer })
    const lines = resolveLines(db, req.items)
    for (const l of lines) l.variant.reserved += l.qty
    const items = toItems(db, lines)
    const subtotal = items.reduce((t, i) => t + i.qty * i.unitPrice, 0)
    const now = Date.now()
    const order: DPickup = {
      id: uuid(), orderNumber: pickupNumber(now, ++db.seq.pickup), status: 'pending', customerId: me.id, createdAt: iso(now),
      pendingExpiresAt: iso(now + s.pendingTimeoutMinutes * 60_000), readyAt: null, readyExpiresAt: null, completedAt: null, closedAt: null, closedReason: null, closeNote: null,
      contact: { name: str(req.contact.name, 100), phone: str(req.contact.phone, 20), comment: str(req.contact.comment, 300) }, items, subtotal, total: subtotal,
      paid: false, paidAt: null, pickupCode: null, history: [{ kind: 'placed', status: 'pending', actorRole: 'customer', actorTelegramId: null, amount: null, note: null, at: iso(now) }],
    }
    me.phone = order.contact.phone
    db.pickups.unshift(order)
    db.idem[req.idempotencyKey] = order.id
    return { duplicate: false, order: pickupJson(order) }
  })
}

// ---------------------------------------------------------------- admin side

const adminItem = (i: DItem) => ({ productId: i.productId, name: i.name, brand: i.brand, size: i.size, color: i.color, colorHex: i.colorHex, qty: i.qty, unitPrice: i.unitPrice })
const adminPickup = (p: DPickup) => ({
  id: p.id, orderNumber: p.orderNumber, status: p.status, createdAt: p.createdAt, pendingExpiresAt: p.pendingExpiresAt, readyAt: p.readyAt, readyExpiresAt: p.readyExpiresAt,
  completedAt: p.completedAt, closedAt: p.closedAt, closedReason: p.closedReason, closeNote: p.closeNote, contact: { ...p.contact }, subtotal: p.subtotal, total: p.total,
  payment: { status: p.paid ? 'paid' : 'unpaid', method: 'cash', paidAt: p.paidAt }, items: p.items.map(adminItem),
})

function fullProduct(p: DProduct) {
  return {
    id: p.id, name: p.name, brandId: p.brandId, categoryId: p.categoryId, description: p.description, price: p.price, oldPrice: p.oldPrice, type: p.type, isNew: p.isNew, active: p.active,
    isSample: p.isSample,
    variants: p.variants.map((v) => ({ id: v.id, size: v.size, colorName: v.colorName, colorHex: v.colorHex, sku: v.sku, active: v.active, quantity: v.quantity, reserved: v.reserved })),
    images: [...p.images].sort((a, b) => a.sortOrder - b.sortOrder),
  }
}

const adminGate = () => {
  if (!isDemoAdmin()) throw forbidden()
}

function dashboard(db: DemoDb) {
  const today = dayKey(Date.now())
  const cnt = (s: string) => db.orders.filter((o) => o.status === s).length
  const todays = db.orders.filter((o) => dayKey(Date.parse(o.createdAt)) === today)
  const doneToday = db.pickups.filter((p) => p.status === 'completed' && p.completedAt && dayKey(Date.parse(p.completedAt)) === today)
  let out = 0
  let low = 0
  for (const p of db.products) {
    if (!p.active) continue
    for (const v of p.variants) {
      if (!v.active) continue
      const a = available(v)
      if (a <= 0) out++
      else if (a <= THRESHOLD) low++
    }
  }
  return {
    cart: {
      new: cnt('new'), confirmed: cnt('confirmed'), preparing: cnt('preparing'), shipped: cnt('shipped'),
      deliveryPending: db.orders.filter((o) => o.deliveryPending && ['new', 'confirmed', 'preparing', 'shipped'].includes(o.status)).length,
      today: todays.length, todayTotal: todays.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
    },
    pickup: {
      pending: db.pickups.filter((p) => p.status === 'pending').length, preparing: db.pickups.filter((p) => p.status === 'preparing').length,
      ready: db.pickups.filter((p) => p.status === 'ready_for_pickup').length, completedToday: doneToday.length, completedTodayTotal: doneToday.reduce((s, p) => s + p.total, 0),
    },
    stock: { threshold: THRESHOLD, out, low },
    catalog: { active: db.products.filter((p) => p.active).length, inactive: db.products.filter((p) => !p.active).length, samples: db.products.filter((p) => p.active && p.isSample).length },
    customers: { total: db.customers.length, newToday: db.customers.filter((c) => dayKey(Date.parse(c.createdAt)) === today).length },
    recentOrders: db.orders.slice(0, 5).map((o) => ({ id: o.id, orderNumber: o.orderNumber, status: o.status, source: 'cart', createdAt: o.createdAt, contactName: o.contact.name, total: o.total })),
  }
}

function customerRow(db: DemoDb, c: DemoDb['customers'][number]) {
  const os = db.orders.filter((o) => o.customerId === c.id)
  const ps = db.pickups.filter((p) => p.customerId === c.id)
  return {
    id: c.id, telegramId: c.telegramId, name: c.name, username: c.username, phone: c.phone, createdAt: c.createdAt, lastSeenAt: c.lastSeenAt,
    cartOrders: os.length, cartSpent: os.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
    pickupOrders: ps.length, pickupSpent: ps.filter((p) => p.status === 'completed').reduce((s, p) => s + p.total, 0),
  }
}

function settingsData(db: DemoDb) {
  const s = db.settings
  return {
    role: 'owner',
    settings: { deliveryFee: s.deliveryFee, deliveryFreeFrom: s.deliveryFreeFrom, allowSampleOrders: s.allowSampleOrders, supportContact: s.supportContact },
    pickup: { ...s.pickup },
    admins: [{ telegramId: ADMIN_ID, name: 'Demo admin', role: 'owner', active: true }],
  }
}

function adminGet(resource: string, p: AdminParams): Record<string, unknown> {
  adminGate()
  const db = open()
  const q = String(p.q ?? '').trim()
  switch (resource) {
    case 'me':
      return { telegramId: ADMIN_ID, name: 'Demo admin', role: 'owner' }
    case 'dashboard':
      return dashboard(db)
    case 'orders': {
      const status = String(p.status ?? '')
      const counts: Record<string, number> = {}
      for (const s of ORDER_STATUSES) counts[s] = db.orders.filter((o) => o.status === s).length
      const rows = db.orders
        .filter((o) => (!status || o.status === status) && (!q || has(`${o.orderNumber} ${o.contact.name} ${o.contact.phone}`, q)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return {
        total: rows.length, counts,
        orders: page(rows, p).map((o) => ({
          id: o.id, orderNumber: o.orderNumber, status: o.status, source: 'cart', createdAt: o.createdAt, contactName: o.contact.name, contactPhone: o.contact.phone,
          total: o.total, deliveryPending: o.deliveryPending, itemCount: o.items.reduce((s, i) => s + i.qty, 0),
        })),
      }
    }
    case 'order': {
      const o = db.orders.find((x) => x.id === String(p.id))
      if (!o) throw notFound()
      const c = db.customers.find((x) => x.id === o.customerId)
      return {
        order: {
          id: o.id, orderNumber: o.orderNumber, status: o.status, source: 'cart', createdAt: o.createdAt, contact: { ...o.contact, comment: o.contact.comment || null },
          subtotal: o.subtotal, deliveryFee: o.deliveryFee, deliveryPending: o.deliveryPending, total: o.total, items: o.items.map(adminItem),
        },
        customer: { id: o.customerId, telegramId: c?.telegramId ?? 0, username: c?.username ?? null, name: c?.name ?? o.contact.name },
        history: [...o.history].sort((a, b) => b.at.localeCompare(a.at)),
      }
    }
    case 'products': {
      const status = String(p.status ?? '')
      const cat = String(p.category ?? '')
      const rows = db.products
        .filter((x) => (!status || (status === 'active') === x.active) && (!cat || x.categoryId === cat) && (!q || has(`${x.name} ${brandName(db, x.brandId)}`, q)))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      return {
        total: rows.length,
        products: page(rows, p).map((x) => ({
          id: x.id, name: x.name, brandName: brandName(db, x.brandId), categoryName: catName(db, x.categoryId), price: x.price, oldPrice: x.oldPrice, active: x.active, isSample: x.isSample, isNew: x.isNew,
          stock: x.variants.filter((v) => v.active).reduce((s, v) => s + v.quantity, 0), variantCount: x.variants.length,
          image: [...x.images].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.path ?? null,
        })),
      }
    }
    case 'product': {
      const x = productOf(db, String(p.id))
      if (!x) throw notFound()
      return { product: fullProduct(x) }
    }
    case 'brands':
      return { brands: db.brands.map((b) => ({ ...b, productCount: db.products.filter((x) => x.brandId === b.id).length, activeProductCount: db.products.filter((x) => x.brandId === b.id && x.active).length })) }
    case 'categories':
      return { categories: [...db.categories].sort((a, b) => a.sortOrder - b.sortOrder).map((c) => ({ ...c, productCount: db.products.filter((x) => x.categoryId === c.id).length, activeProductCount: db.products.filter((x) => x.categoryId === c.id && x.active).length })) }
    case 'inventory': {
      const filter = String(p.filter ?? 'all')
      const rows = db.products.flatMap((x) =>
        x.variants.map((v) => ({
          variantId: v.id, productId: x.id, productName: x.name, size: v.size, colorName: v.colorName, colorHex: v.colorHex, sku: v.sku, quantity: v.quantity, reserved: v.reserved, available: available(v), active: v.active && x.active,
        })),
      )
        .filter((r) => (!q || has(`${r.productName} ${r.colorName} ${r.size} ${r.sku ?? ''}`, q)) && (filter === 'out' ? r.available <= 0 : filter === 'low' ? r.available > 0 && r.available <= THRESHOLD : true))
        .sort((a, b) => a.available - b.available || a.productName.localeCompare(b.productName) || sizeRank(a.size) - sizeRank(b.size))
      return { total: rows.length, threshold: THRESHOLD, items: page(rows, { ...p, limit: p.limit ?? 50 }) }
    }
    case 'customers': {
      const rows = db.customers.filter((c) => !q || has(`${c.name} ${c.username ?? ''} ${c.phone ?? ''} ${c.telegramId}`, q)).sort((a, b) => (b.lastSeenAt ?? '').localeCompare(a.lastSeenAt ?? ''))
      return { total: rows.length, customers: page(rows, p).map((c) => customerRow(db, c)) }
    }
    case 'customer': {
      const c = db.customers.find((x) => x.id === String(p.id))
      if (!c) throw notFound()
      return {
        customer: { id: c.id, telegramId: c.telegramId, name: c.name, username: c.username, phone: c.phone, createdAt: c.createdAt, lastSeenAt: c.lastSeenAt },
        orders: db.orders.filter((o) => o.customerId === c.id).map((o) => ({ id: o.id, orderNumber: o.orderNumber, status: o.status, source: 'cart', createdAt: o.createdAt, total: o.total })),
        pickupOrders: db.pickups.filter((x) => x.customerId === c.id).map((x) => ({ id: x.id, orderNumber: x.orderNumber, status: x.status, createdAt: x.createdAt, total: x.total })),
      }
    }
    case 'settings':
      return settingsData(db)
    default:
      throw notFound()
  }
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30)
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function saveProduct(db: DemoDb, raw: Record<string, unknown>) {
  const name = str(raw.name, 200)
  if (!name) throw bad('INVALID_REQUEST', { field: 'name' })
  const price = int(raw.price)
  if (price === null || price < 1) throw bad('INVALID_REQUEST', { field: 'price' })
  const oldPrice = raw.oldPrice === null || raw.oldPrice === undefined ? null : int(raw.oldPrice)
  if (raw.oldPrice !== null && raw.oldPrice !== undefined && (oldPrice === null || oldPrice <= price)) throw bad('INVALID_REQUEST', { field: 'oldPrice' })
  const brand = db.brands.find((b) => b.id === raw.brandId)
  if (!brand) throw bad('INVALID_REQUEST', { field: 'brandId' })
  if (!db.categories.some((c) => c.id === raw.categoryId)) throw bad('INVALID_REQUEST', { field: 'categoryId' })
  const given = arr(raw.variants).map(rec)
  const keys = new Set<string>()
  for (const v of given) {
    const size = str(v.size, 20)
    const color = str(v.colorName, 40)
    if (!size || !color || !/^#[0-9a-fA-F]{6}$/.test(str(v.colorHex, 7))) throw bad('INVALID_REQUEST', { field: 'variants' })
    const k = `${size.toLowerCase()}|${color.toLowerCase()}`
    if (keys.has(k)) throw conflict('DUPLICATE_VARIANT')
    keys.add(k)
  }
  const id = typeof raw.id === 'string' ? raw.id : null
  let p = id ? productOf(db, id) : undefined
  if (id && !p) throw notFound()
  if (!p) {
    if (given.length === 0) throw bad('INVALID_REQUEST', { field: 'variants' })
    p = { id: `p-${uuid().slice(0, 8)}`, name, brandId: brand.id, categoryId: String(raw.categoryId), description: '', price, oldPrice, type: brand.type, isNew: false, active: true, isSample: false, popularity: 50, createdAt: iso(Date.now()), variants: [], images: [] }
    db.products.unshift(p)
  }
  p.name = name
  p.brandId = brand.id
  p.type = brand.type
  p.categoryId = String(raw.categoryId)
  p.description = str(raw.description, 4000)
  p.price = price
  p.oldPrice = oldPrice
  p.isNew = raw.isNew === true
  p.active = raw.active !== false
  if (typeof raw.isSample === 'boolean') p.isSample = raw.isSample
  for (const v of given) {
    const size = str(v.size, 20)
    const colorName = str(v.colorName, 40)
    const ex = typeof v.id === 'string' ? p.variants.find((x) => x.id === v.id) : undefined
    if (ex) {
      if (p.variants.some((x) => x !== ex && x.size.toLowerCase() === size.toLowerCase() && x.colorName.toLowerCase() === colorName.toLowerCase())) throw conflict('DUPLICATE_VARIANT')
      Object.assign(ex, { size, colorName, colorHex: str(v.colorHex, 7), sku: str(v.sku, 40) || null, active: v.active !== false })
    } else {
      if (p.variants.some((x) => x.size.toLowerCase() === size.toLowerCase() && x.colorName.toLowerCase() === colorName.toLowerCase())) throw conflict('DUPLICATE_VARIANT')
      p.variants.push({ id: `${p.id}-v${uuid().slice(0, 6)}`, size, colorName, colorHex: str(v.colorHex, 7), sku: str(v.sku, 40) || null, active: v.active !== false, quantity: int(v.quantity) ?? 0, reserved: 0 })
    }
  }
  p.variants.sort((a, b) => a.colorName.localeCompare(b.colorName) || sizeRank(a.size) - sizeRank(b.size))
  return p
}

const imgKey = (path: string) => `kiyim:${path}`
const dropImage = (path: string) => {
  try {
    window.localStorage.removeItem(imgKey(path))
  } catch {
    /* ignore */
  }
}

function adminPost(resource: string, body: Record<string, unknown>): Record<string, unknown> {
  adminGate()
  const action = str(body.action, 40)
  return mutate((db) => {
    switch (resource) {
      case 'order': {
        const o = db.orders.find((x) => x.id === String(body.id))
        if (!o) throw notFound()
        if (action === 'set_status') {
          const to = String(body.status)
          if (!(NEXT_STATUS[o.status] ?? []).includes(to)) throw conflict('INVALID_TRANSITION')
          const note = str(body.note, 300)
          if (to === 'cancelled' && note.length < 3) throw bad('INVALID_REASON')
          if (to === 'cancelled') restock(db, o.items)
          o.status = to
          o.history.push({ status: to, by: ADMIN_ID, note: note || null, at: iso(Date.now()) })
          return {}
        }
        if (action === 'set_delivery') {
          const fee = int(body.fee)
          if (fee === null) throw bad('INVALID_REQUEST', { field: 'fee' })
          if (o.status === 'delivered' || o.status === 'cancelled') throw conflict('INVALID_TRANSITION')
          o.deliveryFee = fee
          o.deliveryPending = false
          o.total = o.subtotal + fee
          return {}
        }
        throw bad('INVALID_REQUEST', { field: 'action' })
      }
      case 'product': {
        if (action === 'save') return { product: fullProduct(saveProduct(db, rec(body.product))) }
        if (action === 'image_upload_url') {
          const p = productOf(db, String(body.id))
          if (!p) throw notFound()
          if (!IMAGE_TYPES.includes(String(body.contentType))) throw bad('UNSUPPORTED_TYPE')
          if (p.images.length >= 12) throw conflict('TOO_MANY_IMAGES')
          const path = `demo-img:${uuid().slice(0, 12)}`
          return { path, uploadUrl: `demo-upload://${path}` }
        }
        if (action === 'image_add') {
          const p = productOf(db, String(body.id))
          if (!p) throw notFound()
          const path = String(body.path)
          let stored: string | null = null
          try {
            stored = window.localStorage.getItem(imgKey(path))
          } catch {
            /* ignore */
          }
          if (!path.startsWith('demo-img:') || !stored) throw bad('FILE_MISSING')
          p.images.push({ id: uuid(), path, sortOrder: p.images.reduce((m, i) => Math.max(m, i.sortOrder), 0) + 1 })
          return { product: fullProduct(p) }
        }
        if (action === 'image_cover' || action === 'image_delete') {
          const p = db.products.find((x) => x.images.some((i) => i.id === String(body.id)))
          if (!p) throw notFound()
          const im = p.images.find((i) => i.id === String(body.id))!
          if (action === 'image_delete') {
            p.images = p.images.filter((i) => i !== im)
            dropImage(im.path)
          } else {
            im.sortOrder = p.images.reduce((m, i) => Math.min(m, i.sortOrder), 1) - 1
          }
          return { product: fullProduct(p) }
        }
        throw bad('INVALID_REQUEST', { field: 'action' })
      }
      case 'category': {
        if (action === 'delete') {
          const c = db.categories.find((x) => x.id === String(body.id))
          if (!c) throw notFound()
          if (db.products.some((p) => p.categoryId === c.id)) throw conflict('IN_USE')
          db.categories = db.categories.filter((x) => x !== c)
          return {}
        }
        const name = str(body.name, 80)
        if (!name) throw bad('INVALID_REQUEST', { field: 'name' })
        const sortOrder = Math.round(num(body.sortOrder))
        const ex = typeof body.id === 'string' ? db.categories.find((c) => c.id === body.id) : undefined
        if (ex) Object.assign(ex, { name, sortOrder, active: body.active !== false })
        else {
          let id = slug(name) || `cat-${uuid().slice(0, 6)}`
          while (db.categories.some((c) => c.id === id) || id === 'all') id = `${id}-${uuid().slice(0, 3)}`
          db.categories.push({ id, name, sortOrder, active: body.active !== false })
        }
        return {}
      }
      case 'brand': {
        const name = str(body.name, 80)
        if (!name) throw bad('INVALID_REQUEST', { field: 'name' })
        const type = body.type === 'original' ? 'original' : 'other'
        const ex = typeof body.id === 'string' ? db.brands.find((b) => b.id === body.id) : undefined
        if (ex) {
          Object.assign(ex, { name, type, active: body.active !== false })
          for (const p of db.products) if (p.brandId === ex.id) p.type = type
        } else {
          let id = slug(name) || `brand-${uuid().slice(0, 6)}`
          while (db.brands.some((b) => b.id === id)) id = `${id}-${uuid().slice(0, 3)}`
          db.brands.push({ id, name, type, active: body.active !== false })
        }
        return {}
      }
      case 'inventory': {
        if (action !== 'adjust') throw bad('INVALID_REQUEST', { field: 'action' })
        const v = db.products.flatMap((p) => p.variants).find((x) => x.id === String(body.variantId))
        if (!v) throw notFound()
        const n = typeof body.value === 'number' && Number.isInteger(body.value) ? body.value : null
        if (n === null) throw bad('INVALID_REQUEST', { field: 'value' })
        const target = body.mode === 'set' ? n : v.quantity + n
        if (target < 0) throw bad('INVALID_REQUEST', { field: 'value' })
        if (target < v.reserved) throw conflict('STOCK_BELOW_RESERVED', { reserved: v.reserved })
        v.quantity = target
        return {}
      }
      case 'settings': {
        const s = db.settings
        if (action === 'update') {
          const c = rec(body.settings)
          const fee = c.deliveryFee === null ? null : int(c.deliveryFee)
          const free = c.deliveryFreeFrom === null ? null : int(c.deliveryFreeFrom)
          if (c.deliveryFee !== null && fee === null) throw bad('INVALID_REQUEST', { field: 'deliveryFee' })
          if (c.deliveryFreeFrom !== null && (free === null || free < 1)) throw bad('INVALID_REQUEST', { field: 'deliveryFreeFrom' })
          s.deliveryFee = fee
          s.deliveryFreeFrom = free
          s.allowSampleOrders = c.allowSampleOrders === true
          s.supportContact = str(c.supportContact, 200) || null
          return settingsData(db)
        }
        if (action === 'update_pickup') {
          const c = rec(body.pickup)
          const range = (k: string, lo: number, hi: number) => {
            const n = int(c[k])
            if (n === null || n < lo || n > hi) throw bad('INVALID_REQUEST', { field: k })
            return n
          }
          s.pickup = {
            pendingTimeoutMinutes: range('pendingTimeoutMinutes', 1, 1440), readyHoldHours: range('readyHoldHours', 1, 720), maxActivePerCustomer: range('maxActivePerCustomer', 1, 20), maxLines: range('maxLines', 1, 50),
            storeAddress: str(c.storeAddress, 300) || null, storePhone: str(c.storePhone, 40) || null, storeHours: str(c.storeHours, 300) || null,
          }
          return settingsData(db)
        }
        throw bad('INVALID_REQUEST', { field: 'action' })
      }
      default:
        throw notFound()
    }
  })
}

function adminPickupGet(p: AdminParams): Record<string, unknown> {
  adminGate()
  const db = open()
  if (p.view === 'health') return { healthy: true }
  if (p.id) {
    const o = db.pickups.find((x) => x.id === String(p.id))
    if (!o) throw notFound()
    return { order: adminPickup(o), history: [...o.history].sort((a, b) => b.at.localeCompare(a.at)) }
  }
  const group = String(p.group ?? 'active')
  const by: Record<string, (s: string) => boolean> = {
    active: (s) => ACTIVE_PICKUP.includes(s), pending: (s) => s === 'pending', preparing: (s) => s === 'preparing', ready: (s) => s === 'ready_for_pickup', history: (s) => !ACTIVE_PICKUP.includes(s),
  }
  const match = by[group] ?? by.active
  const rows = db.pickups.filter((x) => match(x.status)).sort((a, b) => (group === 'history' ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)))
  return {
    orders: page(rows, { ...p, limit: p.limit ?? 100 }).map(adminPickup),
    counts: { pending: db.pickups.filter((x) => x.status === 'pending').length, preparing: db.pickups.filter((x) => x.status === 'preparing').length, ready: db.pickups.filter((x) => x.status === 'ready_for_pickup').length },
  }
}

function adminPickupPost(body: Record<string, unknown>): Record<string, unknown> {
  adminGate()
  return mutate((db) => {
    const o = db.pickups.find((x) => x.id === String(body.id))
    if (!o) throw notFound()
    const now = Date.now()
    const log = (status: string, note: string | null = null, amount: number | null = null, kind = 'status') =>
      o.history.push({ kind, status, actorRole: 'owner', actorTelegramId: ADMIN_ID, amount, note, at: iso(now) })
    switch (body.action) {
      case 'start_preparing':
        if (o.status !== 'pending') throw conflict('INVALID_TRANSITION')
        o.status = 'preparing'
        o.pendingExpiresAt = null
        log('preparing')
        break
      case 'mark_ready': {
        if (o.status !== 'preparing') throw conflict('INVALID_TRANSITION')
        let code = ''
        for (let i = 0; i < 8; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
        o.status = 'ready_for_pickup'
        o.pickupCode = code
        o.readyAt = iso(now)
        o.readyExpiresAt = iso(now + db.settings.pickup.readyHoldHours * HOUR)
        log('ready_for_pickup')
        break
      }
      case 'cancel': {
        const reason = str(body.reason, 300)
        if (reason.length < 3) throw bad('INVALID_REASON')
        if (!ACTIVE_PICKUP.includes(o.status)) throw conflict('NOT_CANCELLABLE')
        release(db, o.items)
        o.status = 'cancelled'
        o.closedAt = iso(now)
        o.closedReason = 'admin_cancelled'
        o.closeNote = reason
        o.pickupCode = null
        log('cancelled', reason)
        break
      }
      case 'complete': {
        if (o.status !== 'ready_for_pickup') throw conflict('NOT_READY')
        if (str(body.code, 20).toUpperCase() !== o.pickupCode) throw bad('INVALID_CODE')
        if (body.paymentConfirmed !== true) throw bad('PAYMENT_REQUIRED')
        if (num(body.amount) !== o.total) throw bad('AMOUNT_MISMATCH')
        for (const i of o.items) {
          const v = productOf(db, i.productId)?.variants.find((x) => x.size === i.size && x.colorName === i.color)
          if (v) {
            v.reserved = Math.max(0, v.reserved - i.qty)
            v.quantity = Math.max(0, v.quantity - i.qty)
          }
        }
        o.status = 'completed'
        o.completedAt = iso(now)
        o.closedAt = iso(now)
        o.paid = true
        o.paidAt = iso(now)
        o.pickupCode = null
        log('completed', null, o.total, 'payment')
        break
      }
      default:
        throw bad('INVALID_REQUEST', { field: 'action' })
    }
    return { order: adminPickup(o) }
  })
}

/** Shrinks a photo to ~900 px and keeps it (as a small JPEG) in this browser, so the admin can add pictures in the demo. */
async function adminUpload(uploadUrl: string, file: Blob): Promise<void> {
  const m = /^demo-upload:\/\/(demo-img:[a-z0-9-]+)$/.exec(uploadUrl)
  if (!m) throw new BackendError('invalid', 'BAD_UPLOAD_URL')
  const url = await new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = () => reject(new BackendError('server', 'UPLOAD_FAILED'))
    r.readAsDataURL(file)
  })
  const small = await new Promise<string>((resolve) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, 900 / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.max(1, Math.round(img.width * k))
      c.height = Math.max(1, Math.round(img.height * k))
      c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => resolve(url)
    img.src = url
  })
  try {
    window.localStorage.setItem(imgKey(m[1]), small)
  } catch {
    throw new BackendError('server', 'UPLOAD_FAILED') // storage full
  }
}

const LATENCY_MS = typeof window !== 'undefined' ? 60 : 0
const later = <T,>(fn: () => T): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const run = () => {
      try {
        resolve(fn())
      } catch (e) {
        reject(e)
      }
    }
    if (LATENCY_MS > 0) setTimeout(run, LATENCY_MS)
    else run()
  })

export function createDemoBackend() {
  return {
    catalog: () => later((): unknown => catalogJson(open())),
    signIn: async (): Promise<void> => undefined,
    // the cart lives in this browser already (see lib/cart.tsx), so there is nothing to sync
    getCart: async (): Promise<CartItem[]> => [],
    putCart: async (_items: CartItem[]): Promise<void> => undefined,
    myOrders: () => later((): unknown[] => { const db = open(); return db.orders.filter((o) => o.customerId === db.selfId).map(orderJson) }),
    placeOrder: (req: PlaceOrderRequest) => later((): { duplicate: boolean; order: unknown } => placeOrder(req)),
    pickupOrders: () => later((): unknown[] => { const db = open(); return db.pickups.filter((o) => o.customerId === db.selfId).map(pickupJson) }),
    pickupOrder: (id: string) =>
      later((): unknown => {
        const db = open()
        const o = db.pickups.find((x) => x.id === id && x.customerId === db.selfId)
        if (!o) throw notFound()
        return pickupJson(o)
      }),
    pickupPlace: (req: PickupPlaceRequest) => later((): { duplicate: boolean; order: unknown } => pickupPlace(req)),
    pickupCancel: (id: string) =>
      later((): unknown =>
        mutate((db) => {
          expireOld(db, Date.now())
          const o = db.pickups.find((x) => x.id === id && x.customerId === db.selfId)
          if (!o) throw notFound()
          if (o.status !== 'pending') throw conflict('NOT_CANCELLABLE')
          release(db, o.items)
          const now = Date.now()
          o.status = 'cancelled'
          o.closedAt = iso(now)
          o.closedReason = 'customer_cancelled'
          o.pendingExpiresAt = null
          o.history.push({ kind: 'status', status: 'cancelled', actorRole: 'customer', actorTelegramId: null, amount: null, note: null, at: iso(now) })
          return pickupJson(o)
        }),
      ),
    // ---- demo admin panel (opened from the Profile screen)
    isAdminHint: (): boolean => isDemoAdmin(),
    adminGet: (resource: string, params: AdminParams = {}) => later(() => adminGet(resource, params)),
    adminPost: (resource: string, body: Record<string, unknown> = {}) => later(() => adminPost(resource, body)),
    adminPickupGet: (params: AdminParams = {}) => later(() => adminPickupGet(params)),
    adminPickupPost: (body: Record<string, unknown>) => later(() => adminPickupPost(body)),
    adminUpload,
  }
}
