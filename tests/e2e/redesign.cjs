/* Phone checks for the photography, Liquid Glass, brand customization and Telegram launch. Used by demo.cjs. */
module.exports = async ({ browser, ctx, page, BASE, go, shot, check, wait, visible, photoRequests, standIn }) => {
  const blur = (sel) => page.locator(sel).first().evaluate((el) => getComputedStyle(el).backdropFilter || getComputedStyle(el).webkitBackdropFilter)
  const scrollThrough = () => page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)) }
    for (const rail of document.querySelectorAll('.rail, .overflow-x-auto')) {
      rail.scrollIntoView({ block: 'center' })
      for (let x = 0; x <= rail.scrollWidth; x += 200) { rail.scrollTo({ left: x, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 40)) }
    }
    for (const rail of document.querySelectorAll('.rail, .overflow-x-auto')) rail.scrollLeft = 0
    window.scrollTo(0, 0)
  })
  const imagesState = () => page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img[src*="images.unsplash.com"]')]
    return { total: imgs.length, bad: imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).length, noSize: imgs.filter((i) => !i.getAttribute('width') || !i.getAttribute('srcset')).length, placeholders: document.querySelectorAll('[data-testid="photo-placeholder"]').length }
  })

  // ---- photos load on every shop screen
  for (const path of ['/', '/katalog', '/mahsulot/s-dress-1', '/komplekt/o-classic', '/tezkor-buyurtma']) {
    await go(path); await scrollThrough(); await wait(400)
    const s = await imagesState()
    check(s.total > 0 && s.bad === 0 && s.noSize === 0 && s.placeholders === 0, `${path}: ${s.total} photos loaded (broken ${s.bad}, placeholders ${s.placeholders})`)
  }
  check(photoRequests.every((u) => /[?&]w=\d+/.test(u) && /auto=format/.test(u)), 'photos are requested resized and in modern formats')
  const widest = Math.max(...photoRequests.map((u) => +new URL(u).searchParams.get('w')))
  check(widest <= 1000, `largest photo requested: ${widest}px`)

  // ---- no horizontal overflow on small and normal phones
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 800 })
    const bad = []
    for (const path of ['/', '/katalog', '/mahsulot/s-hoodie-1', '/tezkor-buyurtma', '/savatcha', '/profil', '/admin', '/admin/brand']) {
      await go(path); await wait(250)
      if ((await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)) > 0) bad.push(path)
    }
    check(bad.length === 0, `no horizontal overflow at ${width}px ${bad.join(' ')}`)
  }
  await page.setViewportSize({ width: 390, height: 844 })

  // ---- glass: blur on floating surfaces only
  await go('/')
  check(/blur/.test(await blur('header')), 'header is glass with background blur')
  check(/blur/.test(await blur('.glass-nav')), 'tab bar is glass with background blur')
  check((await blur('[data-testid="product-card"] > div')) === 'none', 'product cards are translucent without per-card blur')
  const blurred = await page.evaluate(() => [...document.querySelectorAll('*')].filter((el) => { const r = el.getBoundingClientRect(); const f = getComputedStyle(el).backdropFilter; return f && f !== 'none' && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth }).length)
  check(blurred <= 12, `blurred surfaces visible on Home: ${blurred}`)
  await page.getByRole('button', { name: /Bildirishnoma/i }).click(); await wait(600)
  check(/blur/.test(await blur('[role="dialog"]')), 'popup sheet is glass')
  await shot('11-popup')
  await page.keyboard.press('Escape'); await wait(400)
  await go('/katalog')
  await shot('11-catalog-filters-closed')
  await page.getByRole('button', { name: /Filtr/i }).first().click(); await wait(600)
  check(/blur/.test(await blur('[role="dialog"]')), 'filter sheet is glass')
  await shot('11-filter')
  await page.keyboard.press('Escape'); await wait(400)
  await go('/mahsulot/s-hoodie-1')
  await page.getByRole('button', { name: /\(1\/2\)/ }).first().click(); await wait(500)
  check(await page.getByTestId('lightbox-counter').isVisible(), 'full-screen photo viewer opens')
  await shot('11-lightbox')
  await page.keyboard.press('Escape'); await wait(400)
  await shot('11-product')

  // ---- brand customization
  const files = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 300
    const g = c.getContext('2d'); g.fillStyle = '#0F7B5F'; g.beginPath(); g.arc(150, 150, 140, 0, 7); g.fill(); g.fillRect(340, 110, 520, 80)
    return { png: c.toDataURL('image/png').split(',')[1] }
  })
  await go('/profil')
  await page.getByTestId('brand-link').click()
  await page.getByTestId('brand-settings').waitFor()
  await shot('12-brand-default')
  await page.getByTestId('brand-name-input').fill('Atlas Moda')
  check((await page.title()) === 'Atlas Moda' && (await page.locator('[data-testid="brand-wordmark"]').first().innerText()) === 'Atlas Moda', 'new name applies immediately (title, header)')
  await page.getByTestId('brand-primary-hex').fill('#0F7B5F')
  await page.getByTestId('brand-secondary-hex').fill('#12302A')
  const vars = await page.evaluate(() => { const s = document.documentElement.style; return [s.getPropertyValue('--brand-primary'), s.getPropertyValue('--brand-secondary')] })
  check(vars[0] === '#0F7B5F' && vars[1] === '#12302A', 'colours apply immediately')
  const logoInput = page.getByTestId('brand-logo-input')
  await logoInput.setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: Buffer.from(files.png, 'base64') })
  await page.getByTestId('brand-logo').first().waitFor({ timeout: 4000 })
  const logo = () => page.getByTestId('brand-logo').first().evaluate(async (img) => {
    await img.decode()
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight
    const g = c.getContext('2d'); g.drawImage(img, 0, 0)
    const box = img.getBoundingClientRect()
    // object-contain keeps proportions inside the box
    return { nw: img.naturalWidth, nh: img.naturalHeight, cornerAlpha: g.getImageData(c.width - 1, 0, 1, 1).data[3], bg: getComputedStyle(img).backgroundColor, fit: getComputedStyle(img).objectFit, h: box.height, w: box.width }
  })
  const a = await logo()
  check(a.nw === 640 && a.nh === 213, `large PNG logo resized with the same proportions (${a.nw}x${a.nh})`)
  check(a.cornerAlpha === 0 && a.bg === 'rgba(0, 0, 0, 0)', 'logo stays transparent, no background painted')
  check(a.fit === 'contain', 'logo is never stretched or cropped')
  await page.getByTestId('brand-show-name').uncheck()
  check((await page.locator('header [data-testid="brand-wordmark"]').count()) === 0, 'name can be hidden next to the logo')
  await logoInput.setInputFiles({ name: 'logo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60"><circle cx="30" cy="30" r="28" fill="#0F7B5F"/><text x="68" y="42" font-family="sans-serif" font-size="34" font-weight="800" fill="#12302A">ATLAS</text></svg>') })
  await wait(500)
  const b = await logo()
  check(b.nw === 240 && b.nh === 60 && b.cornerAlpha === 0, `SVG logo accepted with its proportions (${b.nw}x${b.nh})`)
  check(Math.abs(b.w / b.h - 4) < 0.1, `SVG logo shown 4:1 (${Math.round(b.w)}x${Math.round(b.h)})`)
  await logoInput.setInputFiles({ name: 'bad.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>') })
  check(await page.getByTestId('brand-logo-error').waitFor({ timeout: 3000 }).then(() => true, () => false), 'SVG with a script is refused')
  check(await page.getByTestId('brand-logo-error').evaluate((el) => getComputedStyle(el).color) === 'rgb(155, 44, 56)', 'error text stays red with another brand colour')
  check((await logo()).nw === 240, 'the previous logo is kept after a refused file')
  await shot('12-brand-custom')
  await page.getByRole('link', { name: /Do'konga qaytish|Orqaga/i }).first().click().catch(async () => go('/'))
  await go('/')
  check((await page.locator('header [data-testid="brand-logo"]').count()) === 1, 'logo is shown in the shop header')
  check(await visible('Atlas Moda Original'), 'brand name is used in shop texts and catalog')
  // the Uzbek word "brend" (a sample brand, "Namuna brend A") is shown in capitals by CSS, so compare the real text
  const leftovers = () => page.evaluate(() => [...document.body.textContent.matchAll(/.{0,20}BREND.{0,20}/g)].map((m) => m[0]))
  check((await leftovers()).length === 0, `no placeholder name left on Home ${(await leftovers()).join(' | ')}`)
  check((await page.locator('link[rel="icon"]').getAttribute('href')).startsWith('data:image/svg+xml;base64'), 'favicon follows the logo')
  await shot('12-home-custom')
  await go('/mahsulot/s-hoodie-1'); await shot('12-product-custom')
  await go('/profil'); check((await leftovers()).length === 0, 'no placeholder name left in Profile'); await shot('12-profile-custom')
  await go('/admin/brand')
  await page.getByTestId('brand-glass-solid').click(); await page.getByTestId('brand-backdrop-plain').click()
  check((await page.evaluate(() => document.documentElement.dataset.glass + document.documentElement.dataset.backdrop)) === 'solidplain', 'interface style applies')
  await page.reload({ waitUntil: 'networkidle' })
  check((await page.getByTestId('brand-name-input').inputValue()) === 'Atlas Moda', 'brand survives a reload')
  await page.getByTestId('brand-reset').click()
  check((await page.title()) === 'BREND' && (await page.getByTestId('brand-logo').count()) === 0, 'reset returns the BREND placeholder')

  // ---- photo CDN unreachable: neutral placeholders, shop still works
  const offline = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  await offline.route('**/telegram.org/**', (r) => r.abort())
  await offline.route('https://images.unsplash.com/**', (r) => r.abort())
  const op = await offline.newPage()
  await op.goto(BASE + '/katalog', { waitUntil: 'networkidle' }); await wait(400)
  check((await op.getByTestId('photo-placeholder').count()) > 0 && (await op.getByTestId('product-card').count()) >= 20, 'without photos the catalog still works, with placeholders')
  await offline.close()

  // ---- Telegram Mini App launch (simulated Telegram.WebApp object, not the real client)
  const tg = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await tg.route('https://images.unsplash.com/**', (r) => r.fulfill(standIn(r.request().url())))
  await tg.route('**/telegram.org/**', (r) => r.fulfill({ contentType: 'application/javascript', body: `
    window.__tg = []; const log = (n) => (...a) => window.__tg.push([n, ...a.filter((x) => typeof x !== 'function')].join(':'))
    window.Telegram = { WebApp: { initData: 'query_id=test', initDataUnsafe: { user: { id: 1, first_name: 'Telegram', last_name: 'Sinov' } }, platform: 'ios', colorScheme: 'light', viewportStableHeight: 780,
      BackButton: { show: log('back.show'), hide: log('back.hide'), onClick: log('back.on'), offClick: log('back.off') }, HapticFeedback: { selectionChanged: log('haptic'), impactOccurred: log('haptic') },
      ready: log('ready'), expand: log('expand'), setHeaderColor: log('header'), setBackgroundColor: log('bg'), disableVerticalSwipes: log('noSwipe'), isVersionAtLeast: () => true, onEvent: log('event') } }
    document.documentElement.style.setProperty('--tg-content-safe-area-inset-top', '46px')` }))
  const tp = await tg.newPage()
  const tgErrors = []
  tp.on('pageerror', (e) => tgErrors.push(String(e)))
  await tp.goto(BASE + '/#tgWebAppData=query_id%3Dtest&tgWebAppVersion=8.0', { waitUntil: 'networkidle' })
  const calls = await tp.evaluate(() => window.__tg)
  check(['ready', 'expand', 'header:#F1EEE9', 'bg:#F1EEE9', 'noSwipe'].every((c) => calls.includes(c)), 'Telegram: ready, expand, colours, swipe lock')
  check((await tp.locator('header').first().evaluate((el) => parseFloat(getComputedStyle(el).paddingTop))) >= 46, 'Telegram: header respects the safe area')
  await tp.screenshot({ path: require('node:path').join(__dirname, 'shots', '13-telegram.png') })
  await tp.locator('a[href*="/mahsulot/"]').first().click(); await wait(500)
  check((await tp.evaluate(() => window.__tg)).includes('back.show'), 'Telegram: native Back button on inner screens')
  await tp.getByRole('link', { name: 'Profil' }).click(); await wait(500)
  check((await tp.locator('body').innerText()).includes('Telegram Sinov'), 'Telegram: user name shown in Profile')
  check(tgErrors.length === 0, `Telegram: no page errors ${tgErrors.join(' ')}`)
  await tg.close()
}
