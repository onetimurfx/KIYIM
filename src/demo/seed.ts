/**
 * Starting data of the demo: 26 fictional clothing products, 5 outfits, banners, 8 fictional customers and a few
 * orders in different states so the admin panel is alive from the first tap. Every name, phone and price is made up.
 */
import type { DBanner, DBrand, DCategory, DCustomer, DItem, DOrder, DOutfit, DPickup, DPickupEvent, DProduct, DSettings, DStatusEvent, DVariant, DemoDb } from './db'

export const SELF_ID = '00000000-0000-4000-8000-000000000001'

const CLOTH = ['S', 'M', 'L', 'XL']
const SHOE = ['39', '40', '41', '42', '43', '44']

const C = {
  ivory: { name: 'Fil suyagi', hex: '#EDE6D8' },
  black: { name: 'Qora', hex: '#23262B' },
  navy: { name: "To'q ko'k", hex: '#172B3A' },
  coral: { name: 'Marjon', hex: '#D94B59' },
  beige: { name: 'Bej', hex: '#D9BFA3' },
  olive: { name: 'Zaytun', hex: '#6F745A' },
  gray: { name: 'Kulrang', hex: '#A5A9AD' },
  white: { name: 'Oq', hex: '#F4F2EE' },
  denim: { name: 'Jinsi', hex: '#5C7C99' },
}
type Color = { name: string; hex: string }

export const categories: DCategory[] = [
  ['shoes', 'Poyabzal'], ['trousers', 'Shim'], ['shirts', "Ko'ylak"], ['tshirts', 'Futbolka'], ['dresses', 'Libos'], ['jackets', 'Kurtka'],
  ['hoodies', 'Xudi'], ['sweaters', 'Sviter'], ['outerwear', 'Ustki kiyim'], ['accessories', 'Aksessuarlar'], ['bags', 'Sumkalar'],
].map(([id, name], i) => ({ id, name, sortOrder: i + 1, active: true }))

export const brands: DBrand[] = [
  { id: 'brend', name: 'BREND Original', type: 'original', active: true },
  { id: 'sample-a', name: 'Namuna brend A', type: 'other', active: true },
  { id: 'sample-b', name: 'Namuna brend B', type: 'other', active: true },
]

interface P { id: string; name: string; cat: string; brand: string; price: number; colors: Color[]; desc: string; isNew?: boolean; pop: number; old?: number; stock?: 'out' | 'low' }
const PRODUCTS: P[] = [
  { id: 's-sneaker-1', name: 'Oq krossovka', cat: 'shoes', brand: 'brend', price: 690000, colors: [C.white, C.beige], isNew: true, pop: 95, desc: "Kundalik kiyish uchun yengil oq krossovka. Yumshoq tagcharm va nafas oluvchi ichki qatlam bilan kun bo'yi qulay." },
  { id: 's-sneaker-2', name: 'Shahar krossovkasi', cat: 'shoes', brand: 'sample-a', price: 820000, old: 990000, colors: [C.black, C.gray], pop: 80, desc: "Shahar bo'ylab yurish uchun mos, qalin tagli krossovka. Namlikka chidamli sirt, mustahkam bog'ich." },
  { id: 's-sneaker-3', name: 'Charm loafer', cat: 'shoes', brand: 'brend', price: 1190000, colors: [C.black, C.beige], isNew: true, pop: 63, desc: "Klassik loafer: yumshoq charm, qo'lda tikilgan chok. Ofis ham, oqshom ham mos keladi." },
  { id: 's-shirt-1', name: "Klassik ko'ylak", cat: 'shirts', brand: 'brend', price: 420000, colors: [C.white, C.denim], isNew: true, pop: 70, desc: "Sof paxtadan to'g'ri kesimli ko'ylak. Yengi uzun, yoqasi qattiq, dazmolga bardoshli mato." },
  { id: 's-shirt-2', name: "Kundalik ko'ylak", cat: 'shirts', brand: 'sample-b', price: 360000, old: 450000, colors: [C.beige, C.olive], pop: 55, desc: "Yumshoq va yengil kundalik ko'ylak. Ustidan ham, ichidan ham kiyish mumkin." },
  { id: 's-shirt-3', name: "Ipak ko'ylak", cat: 'shirts', brand: 'sample-a', price: 640000, colors: [C.ivory, C.navy], isNew: true, pop: 58, desc: "Silliq, yaltiroq tusli ko'ylak. Bahor va kuz uchun, erkin tushadigan kesim." },
  { id: 's-tee-1', name: 'Oddiy futbolka', cat: 'tshirts', brand: 'brend', price: 190000, colors: [C.coral, C.white, C.black], isNew: true, pop: 88, desc: "Zich paxtali oddiy futbolka. Yuvilganda shaklini saqlaydi, har qanday kiyim ostiga mos." },
  { id: 's-tee-2', name: 'Keng futbolka', cat: 'tshirts', brand: 'sample-a', price: 210000, colors: [C.navy, C.gray], pop: 60, desc: "Erkin kesimli, tushgan yelkali keng futbolka. Shahar uslubi uchun." },
  { id: 's-tee-3', name: 'Polo futbolka', cat: 'tshirts', brand: 'sample-b', price: 260000, colors: [C.white, C.olive, C.navy], pop: 66, desc: "Yoqali polo: piqué to'qima, ikki tugmali. Yozda qulay va ozoda ko'rinadi." },
  { id: 's-pants-1', name: 'Klassik shim', cat: 'trousers', brand: 'brend', price: 480000, colors: [C.navy, C.black], pop: 75, desc: "To'g'ri kesimli klassik shim. Elastik mato, tik turgan chiziq, ofis uchun ideal." },
  { id: 's-pants-2', name: 'Keng shim', cat: 'trousers', brand: 'sample-b', price: 520000, old: 640000, colors: [C.olive, C.beige], pop: 58, desc: "Belida bog'ich bor, keng oyoqli shim. Harakatda erkin, kundalik kiyim uchun." },
  { id: 's-pants-3', name: 'Jinsi shim', cat: 'trousers', brand: 'sample-a', price: 560000, colors: [C.denim, C.black], pop: 69, desc: "Zich jinsi matodan to'g'ri kesimli shim. Vaqt o'tishi bilan tanaga moslashadi." },
  { id: 's-dress-1', name: 'Yozgi libos', cat: 'dresses', brand: 'brend', price: 760000, colors: [C.coral, C.ivory], isNew: true, pop: 92, desc: "Yengil, tizzadan pastga tushadigan yozgi libos. Nafas oluvchi mato, belida ingichka kamar." },
  { id: 's-dress-2', name: 'Kechki libos', cat: 'dresses', brand: 'sample-a', price: 1190000, colors: [C.navy, C.black], pop: 66, stock: 'out', desc: "Tantanali tadbirlar uchun uzun kechki libos. Yaltiroq mato va ochiq yelka." },
  { id: 's-jacket-1', name: 'Yengil kurtka', cat: 'jackets', brand: 'brend', price: 890000, colors: [C.olive, C.black], pop: 72, desc: "Kech bahor va erta kuz uchun yengil kurtka. Suv o'tkazmaydigan sirt, ichki cho'ntak." },
  { id: 's-jacket-2', name: 'Jinsi kurtka', cat: 'jackets', brand: 'sample-b', price: 740000, old: 920000, colors: [C.denim], pop: 61, desc: "Klassik jinsi kurtka: metall tugmalar, ikki ko'krak cho'ntagi. Har qanday kiyim ustidan." },
  { id: 's-hoodie-1', name: 'Yumshoq xudi', cat: 'hoodies', brand: 'brend', price: 540000, colors: [C.gray, C.coral, C.navy], isNew: true, pop: 90, desc: "Ichi momiq, yumshoq xudi. Kapyushonli, oldida katta cho'ntak, kunlik kiyish uchun eng qulay." },
  { id: 's-hoodie-2', name: 'Oversayz xudi', cat: 'hoodies', brand: 'sample-a', price: 580000, colors: [C.black, C.beige], pop: 64, stock: 'low', desc: "Keng kesimli, tushgan yelkali oversayz xudi. Qalin trikotaj, issiq." },
  { id: 's-sweater-1', name: 'Trikotaj sviter', cat: 'sweaters', brand: 'sample-b', price: 460000, colors: [C.ivory, C.beige], pop: 52, stock: 'low', desc: "Yumshoq trikotaj sviter, yoqasi yumaloq. Teriga yoqimli, sovuq kunlar uchun." },
  { id: 's-sweater-2', name: "Yo'l-yo'l sviter", cat: 'sweaters', brand: 'brend', price: 490000, old: 590000, colors: [C.navy, C.ivory], pop: 57, desc: "Dengizchi uslubidagi yo'l-yo'l sviter. Paxta va akril aralashmasi, issiq va yengil." },
  { id: 's-coat-1', name: 'Uzun palto', cat: 'outerwear', brand: 'brend', price: 1490000, colors: [C.beige, C.black], isNew: true, pop: 78, desc: "Tizzadan pastga tushadigan uzun palto. Jun aralash mato, ichi astarli, qish uchun." },
  { id: 's-coat-2', name: 'Issiq paxta kurtka', cat: 'outerwear', brand: 'sample-a', price: 1290000, colors: [C.navy, C.olive], pop: 59, stock: 'out', desc: "Qalin paxta to'ldirilgan qishki kurtka. Shamoldan himoya qiluvchi yoqa va kapyushon." },
  { id: 's-acc-1', name: "Quyosh ko'zoynagi", cat: 'accessories', brand: 'sample-b', price: 240000, colors: [C.black, C.coral], pop: 68, desc: "UV himoyali linzalar, yengil ramka. Yozgi kunlarda ko'zni asraydi." },
  { id: 's-acc-2', name: 'Charm kamar', cat: 'accessories', brand: 'brend', price: 220000, old: 280000, colors: [C.black, C.beige], pop: 54, desc: "Haqiqiy charmdan kamar, silliq metall to'qa. Shim va jinsiga mos." },
  { id: 's-bag-1', name: 'Ayollar sumkasi', cat: 'bags', brand: 'brend', price: 650000, colors: [C.coral, C.beige], isNew: true, pop: 85, desc: "Ixcham, ammo sig'imli ayollar sumkasi. Magnitli qopqoq, ichki cho'ntak." },
  { id: 's-bag-2', name: 'Shahar sumkasi', cat: 'bags', brand: 'sample-a', price: 570000, colors: [C.black, C.navy], pop: 62, stock: 'low', desc: "Noutbuk va hujjatlar sig'adigan shahar sumkasi. Yelkaga osish qulay." },
  { id: 's-bag-3', name: 'Yelkali sumka', cat: 'bags', brand: 'brend', price: 480000, colors: [C.black, C.olive], pop: 56, desc: "Ixcham yelkali sumka: telefon, hamyon va kalitlar uchun. Sozlanadigan tasma." },
]

const sizesOf = (cat: string) => (cat === 'shoes' ? SHOE : cat === 'bags' || cat === 'accessories' ? ['Yagona'] : CLOTH)

/** deterministic "random" so every fresh demo starts the same */
const hash = (s: string) => [...s].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 100003, 7)

function variantsOf(p: P): DVariant[] {
  const out: DVariant[] = []
  let n = 0
  for (const color of p.colors) {
    for (const size of sizesOf(p.cat)) {
      const h = hash(`${p.id}${size}${color.name}`)
      let quantity = 3 + (h % 10)
      if (p.stock === 'out') quantity = 0
      else if (p.stock === 'low') quantity = h % 4 // 0..3
      out.push({ id: `${p.id}-v${++n}`, size, colorName: color.name, colorHex: color.hex, sku: `${p.id.toUpperCase().replace('S-', '')}-${n}`, active: true, quantity, reserved: 0 })
    }
  }
  return out
}

export const outfits: DOutfit[] = [
  { id: 'o-classic', title: 'Kundalik klassika', note: "Ko'ylak + shim + krossovka", productIds: ['s-shirt-1', 's-pants-1', 's-sneaker-1'] },
  { id: 'o-street', title: 'Shahar uslubi', note: 'Xudi + shim + krossovka', productIds: ['s-hoodie-1', 's-pants-2', 's-sneaker-2'] },
  { id: 'o-evening', title: 'Yozgi kun', note: "Libos + sumka + ko'zoynak", productIds: ['s-dress-1', 's-bag-1', 's-acc-1'] },
  { id: 'o-light', title: 'Yengil qatlam', note: 'Kurtka + futbolka + krossovka', productIds: ['s-jacket-1', 's-tee-1', 's-sneaker-1'] },
  { id: 'o-office', title: 'Ofis uslubi', note: "Ipak ko'ylak + shim + loafer", productIds: ['s-shirt-3', 's-pants-1', 's-sneaker-3'] },
]

export const banners: DBanner[] = [
  { id: 'b-new', title: 'Yangi kolleksiya', subtitle: "Eng so'nggi qo'shilgan modellar", to: '/katalog?f=new', tone: 'coral' },
  { id: 'b-original', title: 'BREND Original', subtitle: 'Faqat bizning mahsulotlar', to: '/katalog?f=original', tone: 'navy' },
  { id: 'b-sale', title: 'Chegirmadagi mahsulotlar', subtitle: 'Narxi pasaytirilgan modellar', to: '/katalog?f=discount', tone: 'beige' },
]

const NAMES: [string, string][] = [
  ['Jasur Karimov', 'jasur_k'], ['Dilnoza Yusupova', 'dilnoza_y'], ['Sherzod Rahimov', 'sherzod_r'], ['Madina Aliyeva', 'madina_a'],
  ['Bekzod Tursunov', 'bekzod_t'], ['Nigora Ismoilova', 'nigora_i'], ['Otabek Saidov', 'otabek_s'], ['Zarina Nazarova', 'zarina_n'],
]

const DAY = 86_400_000
const HOUR = 3_600_000
const iso = (t: number) => new Date(t).toISOString()
const fakeUuid = (kind: number, n: number) => `00000000-0000-4000-8000-${String(kind * 1000 + n).padStart(12, '0')}`
const ymd = (t: number) => {
  const d = new Date(t)
  return `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
}
export const cartNumber = (t: number, n: number) => `BRD-${ymd(t)}-${String(n).padStart(5, '0')}`
export const pickupNumber = (t: number, n: number) => `BRP-${ymd(t)}-${String(n).padStart(5, '0')}`

export const settings = (): DSettings => ({
  deliveryFee: 25000,
  deliveryFreeFrom: 500000,
  allowSampleOrders: true,
  supportContact: '@brend_demo',
  pickup: { pendingTimeoutMinutes: 1440, readyHoldHours: 48, maxActivePerCustomer: 3, maxLines: 10, storeAddress: "Toshkent sh., Namuna ko'chasi 1 (demo)", storePhone: '+998 71 000 00 00', storeHours: '10:00–20:00' },
})

export function buildSeed(now: number): DemoDb {
  const brandName = new Map(brands.map((b) => [b.id, b.name]))
  const products: DProduct[] = PRODUCTS.map((p, i) => ({
    id: p.id, name: p.name, brandId: p.brand, categoryId: p.cat, description: p.desc, price: p.price, oldPrice: p.old ?? null,
    type: p.brand === 'brend' ? 'original' : 'other', isNew: p.isNew === true, active: true, isSample: false, popularity: p.pop,
    createdAt: iso(now - (i + 1) * 1.5 * DAY), variants: variantsOf(p), images: [],
  }))
  const byId = new Map(products.map((p) => [p.id, p]))

  const item = (pid: string, ci: number, si: number, qty: number): DItem => {
    const p = byId.get(pid)!
    const v = p.variants.filter((x) => x.size === sizesOf(p.categoryId)[si % sizesOf(p.categoryId).length])
    const pick = v[ci % v.length] ?? p.variants[0]
    return { productId: p.id, name: p.name, brand: brandName.get(p.brandId) ?? '', categoryId: p.categoryId, size: pick.size, color: pick.colorName, colorHex: pick.colorHex, qty, unitPrice: p.price }
  }
  const sum = (items: DItem[]) => items.reduce((s, i) => s + i.qty * i.unitPrice, 0)

  const customers: DCustomer[] = NAMES.map(([name, username], i) => ({
    id: fakeUuid(1, i + 1), telegramId: 7_000_000_001 + i, name, username,
    phone: `+99890000${String(100 + i).padStart(4, '0')}`, createdAt: iso(now - (20 - i) * DAY), lastSeenAt: iso(now - i * 5 * HOUR),
  }))
  const cu = (i: number) => customers[i % customers.length]

  // ---- cart orders (delivery)
  interface Seed { c: number; ago: number; items: DItem[]; status: string; pending?: boolean }
  const plan: Seed[] = [
    { c: 0, ago: 6 * HOUR, items: [item('s-hoodie-1', 0, 1, 1), item('s-tee-1', 1, 2, 2)], status: 'new' },
    { c: 1, ago: 20 * HOUR, items: [item('s-dress-1', 0, 1, 1)], status: 'new', pending: true },
    { c: 2, ago: 1 * DAY + 3 * HOUR, items: [item('s-jacket-1', 0, 2, 1), item('s-pants-1', 1, 2, 1)], status: 'confirmed' },
    { c: 3, ago: 2 * DAY, items: [item('s-bag-1', 0, 0, 1)], status: 'preparing' },
    { c: 4, ago: 3 * DAY, items: [item('s-sneaker-1', 0, 3, 1)], status: 'shipped' },
    { c: 5, ago: 4 * DAY, items: [item('s-coat-1', 0, 1, 1), item('s-acc-2', 0, 0, 1)], status: 'delivered' },
    { c: 6, ago: 6 * DAY, items: [item('s-shirt-1', 1, 2, 2)], status: 'delivered' },
    { c: 7, ago: 8 * DAY, items: [item('s-sweater-2', 0, 1, 1), item('s-pants-3', 0, 2, 1)], status: 'delivered' },
    { c: 0, ago: 10 * DAY, items: [item('s-tee-3', 2, 1, 3)], status: 'delivered' },
    { c: 2, ago: 12 * DAY, items: [item('s-sneaker-2', 1, 0, 1)], status: 'cancelled' },
  ]
  const PATH: Record<string, string[]> = {
    new: ['new'], confirmed: ['new', 'confirmed'], preparing: ['new', 'confirmed', 'preparing'], shipped: ['new', 'confirmed', 'preparing', 'shipped'],
    delivered: ['new', 'confirmed', 'preparing', 'shipped', 'delivered'], cancelled: ['new', 'cancelled'],
  }
  const orders: DOrder[] = plan.map((s, i) => {
    const t = now - s.ago
    const subtotal = sum(s.items)
    const fee = s.pending ? null : subtotal >= 500000 ? 0 : 25000
    const hist: DStatusEvent[] = PATH[s.status].map((st, k) => ({ status: st, by: k === 0 ? null : 900_000_001, note: st === 'cancelled' ? 'Mijoz so‘rovi bilan' : null, at: iso(t + k * 2 * HOUR) }))
    const c = cu(s.c)
    return {
      id: fakeUuid(2, i + 1), orderNumber: cartNumber(t, i + 1), status: s.status, customerId: c.id, createdAt: iso(t),
      contact: { name: c.name, phone: c.phone ?? '', address: `Toshkent sh., Namuna ko'chasi ${10 + i}-uy`, comment: '' },
      subtotal, deliveryFee: fee, deliveryPending: s.pending === true, total: subtotal + (fee ?? 0), items: s.items, history: hist,
    }
  })

  // ---- pickup orders (store pickup)
  const ev = (kind: string, status: string, at: number, role = 'customer', note: string | null = null, amount: number | null = null): DPickupEvent => ({ kind, status, actorRole: role, actorTelegramId: role === 'customer' ? null : 900_000_001, amount, note, at: iso(at) })
  const pickups: DPickup[] = []
  const pk = (c: number, ago: number, items: DItem[], status: string, extra: Partial<DPickup> = {}) => {
    const n = pickups.length + 1
    const t = now - ago
    const c0 = cu(c)
    const subtotal = sum(items)
    pickups.push({
      id: fakeUuid(3, n), orderNumber: pickupNumber(t, n), status, customerId: c0.id, createdAt: iso(t),
      pendingExpiresAt: status === 'pending' ? iso(t + 24 * HOUR) : null, readyAt: null, readyExpiresAt: null, completedAt: null, closedAt: null, closedReason: null, closeNote: null,
      contact: { name: c0.name, phone: c0.phone ?? '', comment: '' }, items, subtotal, total: subtotal, paid: false, paidAt: null, pickupCode: null,
      history: [ev('placed', 'pending', t)], ...extra,
    })
  }
  pk(1, 2 * HOUR, [item('s-tee-2', 0, 1, 1)], 'pending')
  pk(2, 5 * HOUR, [item('s-sneaker-1', 0, 2, 1)], 'preparing', { history: [ev('placed', 'pending', now - 5 * HOUR), ev('status', 'preparing', now - 4 * HOUR, 'admin')] })
  pk(3, 9 * HOUR, [item('s-hoodie-2', 1, 1, 1), item('s-acc-1', 0, 0, 1)], 'ready_for_pickup', {
    readyAt: iso(now - 7 * HOUR), readyExpiresAt: iso(now + 41 * HOUR), pickupCode: 'K7M2X9QA',
    history: [ev('placed', 'pending', now - 9 * HOUR), ev('status', 'preparing', now - 8 * HOUR, 'admin'), ev('status', 'ready_for_pickup', now - 7 * HOUR, 'admin')],
  })
  const done = [item('s-shirt-2', 0, 1, 1)]
  pk(4, 1 * DAY + 2 * HOUR, done, 'completed', {
    readyAt: iso(now - 20 * HOUR), completedAt: iso(now - 2 * HOUR), closedAt: iso(now - 2 * HOUR), paid: true, paidAt: iso(now - 2 * HOUR),
    history: [ev('placed', 'pending', now - 26 * HOUR), ev('status', 'ready_for_pickup', now - 20 * HOUR, 'admin'), ev('payment', 'completed', now - 2 * HOUR, 'admin', null, sum(done))],
  })
  pk(5, 3 * DAY, [item('s-bag-3', 0, 0, 1)], 'cancelled', {
    closedAt: iso(now - 3 * DAY + HOUR), closedReason: 'customer_cancelled', history: [ev('placed', 'pending', now - 3 * DAY), ev('status', 'cancelled', now - 3 * DAY + HOUR)],
  })

  // active pickup orders hold stock
  for (const p of pickups) {
    if (p.status !== 'pending' && p.status !== 'preparing' && p.status !== 'ready_for_pickup') continue
    for (const i of p.items) {
      const v = byId.get(i.productId)?.variants.find((x) => x.size === i.size && x.colorName === i.color)
      if (v) {
        v.quantity = Math.max(v.quantity, v.reserved + i.qty)
        v.reserved += i.qty
      }
    }
  }

  // the visitor's own history, so Profile and "Mening buyurtmalarim" are not empty on the first launch
  const mine = [orders[4], orders[5], pickups[2], pickups[3]]
  for (const o of mine) {
    o.customerId = SELF_ID
    o.contact.name = 'Demo mijoz'
    o.contact.phone = '+998901234567'
  }
  const self: DCustomer = { id: SELF_ID, telegramId: 900_000_001, name: 'Demo mijoz', username: null, phone: '+998901234567', createdAt: iso(now), lastSeenAt: iso(now) }
  return {
    v: 1, seededAt: now, categories: categories.map((c) => ({ ...c })), brands: brands.map((b) => ({ ...b })), products,
    outfits: outfits.map((o) => ({ ...o, productIds: [...o.productIds] })), banners: banners.map((b) => ({ ...b })),
    customers: [...customers, self], orders, pickups, settings: settings(), seq: { order: orders.length, pickup: pickups.length }, idem: {}, selfId: SELF_ID,
  }
}
