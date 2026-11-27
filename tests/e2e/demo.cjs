/* Demo e2e (phone size). Run: VITE_BASE=/KIYIM/ npm run build && node tests/e2e/demo.cjs
   Starts `vite preview` itself unless DEMO_BASE is set. Chrome: CHROME_PATH or the system one. */
const { chromium } = require('playwright-core')
const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const ORIGIN = (process.env.DEMO_BASE || 'http://127.0.0.1:4173').replace(/\/$/, '')
const BASE = ORIGIN + '/KIYIM'
const SHOTS = path.join(__dirname, 'shots')
const fails = []
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) fails.push(msg) }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const standIn = (url) => {
  const u = new URL(url); const w = +u.searchParams.get('w') || 400; const h = +u.searchParams.get('h') || 400
  const hue = [...u.pathname].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 0)
  const body = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},22%,74%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},20%,48%)"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><text x="50" y="48" text-anchor="middle" font-family="sans-serif" font-size="9" font-weight="700" fill="#fff">TEST FOTO</text><text x="50" y="59" text-anchor="middle" font-family="sans-serif" font-size="5" fill="#fff">haqiqiy rasm emas</text></svg>`
  return { status: 200, contentType: 'image/svg+xml', body }
}
async function waitFor(url) { for (let i = 0; i < 60; i++) { try { if ((await fetch(url)).ok) return } catch {} await wait(250) } throw new Error('server did not start') }

;(async () => {
  fs.mkdirSync(SHOTS, { recursive: true })
  const server = process.env.DEMO_BASE ? null : spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'ignore', detached: true, env: { ...process.env, VITE_BASE: '/KIYIM/' } })
  try {
    await waitFor(BASE + '/')
    const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }))
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(String(e)))
    page.on('console', (m) => m.type() === 'error' && !/telegram\.org|ERR_|Failed to load resource/.test(m.text()) && errors.push(m.text()))
    await page.route('**/telegram.org/**', (r) => r.abort())
    // The test never depends on the real photo CDN: every request gets a clearly labelled stand-in of the asked size.
    const photoRequests = []
    await ctx.route('https://images.unsplash.com/**', (r) => { photoRequests.push(r.request().url()); return r.fulfill(standIn(r.request().url())) })
    const shot = (n) => page.screenshot({ path: path.join(SHOTS, n + '.png') })
    const go = async (p) => { await page.goto(BASE + p, { waitUntil: 'networkidle' }) }
    const visible = (txt) => page.getByText(txt, { exact: false }).first().waitFor({ state: 'visible', timeout: 4000 }).then(() => true, () => false)

    // ---- storefront
    await go('/')
    const body0 = await page.locator('body').innerText()
    check(!/aynimo|angar/i.test(body0 + (await page.content())), 'no old brand names in the page')
    check((await page.locator('[data-testid="brand-wordmark"]').first().innerText()) === 'BREND', 'wordmark BREND')
    await shot('01-home')
    await go('/katalog')
    const n = await page.locator('a[href*="/mahsulot/"]').count()
    check(n >= 20 && n <= 30, `catalog has ${n} products`)
    await shot('02-catalog')

    // ---- add to cart -> checkout -> order
    await go('/mahsulot/s-hoodie-1')
    await page.getByRole('radio').filter({ hasNot: page.locator('[disabled]') }).first().click()
    await page.getByTestId('add-to-cart').click()
    await go('/savatcha')
    check(await visible('Xudi') || await visible('xudi'), 'cart shows the hoodie')
    await shot('03-cart')
    await go('/savatcha/buyurtma')
    await page.getByTestId('f-name').fill('Sardor Test')
    await page.getByTestId('f-phone').fill('901112233')
    await page.getByTestId('f-address').fill("Toshkent, Chilonzor 9-kvartal, 12-uy")
    await shot('04-checkout')
    await page.getByTestId('submit-order').click()
    await page.waitForURL(/\/buyurtma\//, { timeout: 8000 }).catch(() => {})
    await page.getByTestId('order-ref').waitFor({ timeout: 4000 }).catch(() => {})
    const orderNo = (await page.locator('body').innerText()).match(/BRD-\d{6}-\d{5}/)?.[0]
    check(!!orderNo, `order placed: ${orderNo}`)
    await shot('05-order')
    await go('/profil')
    check(orderNo ? await visible(orderNo) : false, 'order is listed in Profile')
    check(await visible('BRD-'), 'seeded history visible in Profile')
    await shot('06-profile')

    // ---- cart is empty again, stock decreased (catalog reload)
    await go('/savatcha')
    check(await visible("bo'sh"), 'cart emptied after the order')

    // ---- store pickup ("Tezkor buyurtma"): customer places, then the shop prepares / hands over in the admin
    await go('/mahsulot/s-tee-1')
    await page.getByRole('radio').filter({ hasNot: page.locator('[disabled]') }).first().click()
    await page.getByTestId('quick-order').click()
    await page.waitForURL(/\/tezkor-buyurtma/)
    check(await page.getByTestId('quick-line').first().waitFor({ timeout: 4000 }).then(() => true, () => false), 'quick basket has the T-shirt')
    await page.getByTestId('f-name').fill('Sardor Test')
    await page.getByTestId('f-phone').fill('901112233')
    await shot('05b-quick')
    await page.getByTestId('submit-order').click()
    await page.waitForURL(/\/tezkor-buyurtma\/[0-9a-f-]{36}/, { timeout: 8000 }).catch(() => {})
    await page.getByText(/BRP-\d{6}-\d{5}/).first().waitFor({ timeout: 4000 }).catch(() => {})
    const pickUrl = page.url()
    const pickNo = (await page.locator('body').innerText()).match(/BRP-\d{6}-\d{5}/)?.[0]
    check(!!pickNo, `pickup order placed: ${pickNo}`)
    await shot('05c-pickup')

    // ---- demo admin
    await go('/admin')
    check(await visible("Ruxsat yo'q"), 'admin is closed until demo admin is switched on')
    await go('/profil')
    await page.getByTestId('admin-link').click()
    await page.waitForURL(/\/admin/)
    check(await visible('Buyurtmalar'), 'demo admin dashboard opens from Profile')
    await shot('07-admin')
    await go('/admin/orders')
    check(orderNo ? await visible(orderNo) : false, 'new order is visible in the admin orders')
    await shot('08-admin-orders')
    if (orderNo) {
      await page.getByText(orderNo).first().click()
      await page.getByRole('button', { name: /Tasdiqlash|tasdiqla/i }).first().click().catch(() => {})
      await wait(500)
      await shot('09-admin-order')
    }
    await go('/admin/pickup')
    check(pickNo ? await visible(pickNo) : false, 'pickup order is visible in the admin pickup list')
    await shot('09b-admin-pickup')
    await page.getByTestId('pickup-row').filter({ hasText: pickNo }).click()
    await page.getByTestId('pk-start').click()
    await page.getByTestId('pk-ready').click()
    await page.getByTestId('pk-complete').waitFor({ timeout: 4000 })
    check(true, 'admin: pending -> preparing -> ready')
    await shot('09c-admin-ready')
    await page.goto(pickUrl, { waitUntil: 'networkidle' })
    const code = (await page.getByTestId('pickup-code').innerText().catch(() => '')).replace(/\s/g, '')
    check(/^[A-HJ-NP-Z2-9]{8}$/.test(code), `customer sees the pickup code ${code}`)
    await shot('09d-customer-code')
    await go('/admin/pickup')
    await page.getByTestId('pickup-row').filter({ hasText: pickNo }).click()
    await page.getByTestId('pk-complete').click()
    await page.getByTestId('pk-code').fill(code)
    await page.getByTestId('pk-paid').check()
    await page.getByTestId('pk-complete-confirm').click()
    await wait(600)
    await go('/tezkor-buyurtma/' + pickUrl.split('/').pop())
    check(await visible('Topshirildi'), 'pickup completed after the code + cash payment')
    await shot('09e-completed')
    for (const p of ['/admin/pickup', '/admin/products', '/admin/categories', '/admin/inventory', '/admin/customers', '/admin/settings']) {
      await go(p)
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      check(over <= 0, `admin ${p} renders without horizontal overflow`)
      await shot('10-' + p.split('/').pop())
    }

    await require('./redesign.cjs')({ browser, ctx, page, BASE, go, shot, check, wait, visible, photoRequests, standIn })

    // ---- persistence + reset
    await go('/profil')
    check(orderNo ? await visible(orderNo) : false, 'data survives a reload (localStorage)')
    await page.getByTestId('demo-reset').click()
    await page.getByTestId('demo-reset-yes').click()
    await page.waitForLoadState('networkidle')
    await go('/profil')
    check(!(orderNo && (await page.locator('body').innerText()).includes(orderNo)), 'reset restores the original demo data')

    check(errors.length === 0, `no console/page errors ${errors.slice(0, 3).join(' || ')}`)
    await browser.close()
  } finally { if (server) try { process.kill(-server.pid) } catch {} }
  console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASSED')
  process.exit(fails.length ? 1 : 0)
})().catch((e) => { console.error(e); process.exit(1) })
