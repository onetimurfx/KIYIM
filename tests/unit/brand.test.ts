import { afterEach, describe, expect, it } from 'vitest'
import { contrast, mix, normalizeHex, onColor, readableOn } from '../../src/brand/color'
import { DEFAULT_BRAND, NAME_MAX, PRESETS } from '../../src/brand/defaults'
import { brandStore, brandText } from '../../src/brand/instance'
import { isSafeSvg, LogoError, readLogo, sniffLogo, svgSize, withSvgSize } from '../../src/brand/logo'
import { cleanName, createBrandStore, sanitizeBrand, type KeyValue } from '../../src/brand/store'
import { faviconFor, themeVars } from '../../src/brand/theme'
import { withBrandName } from '../../src/data/brandedCatalog'
import { NO_SETTINGS } from '../../src/data/catalog'
import { t } from '../../src/i18n'

const memory = () => {
  const data = new Map<string, string>()
  const kv: KeyValue = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) }
  return { data, kv }
}
const PNG = 'data:image/png;base64,iVBORw0KGgo='
const enc = (s: string) => new TextEncoder().encode(s)

afterEach(() => brandStore.reset())

describe('brand colours', () => {
  it('normalizes hex codes and rejects everything else', () => {
    expect(normalizeHex('#d94b59')).toBe('#D94B59')
    expect(normalizeHex('abc')).toBe('#AABBCC')
    for (const bad of ['red', '#12345', '#1234567', 'url(x)', 'red;background:url(x)', 5, null]) expect(normalizeHex(bad)).toBeNull()
  })
  it('keeps button text and accent text legible for any colour a shop picks', () => {
    const colours = ['#FFFFFF', '#000000', '#F9B928', '#FFFF00', '#D94B59', '#00FF7F', '#87CEEB', '#808080', ...PRESETS.map((p) => p.primary), ...PRESETS.map((p) => p.secondary)]
    for (const c of colours) {
      const v = themeVars({ ...DEFAULT_BRAND, primary: c, secondary: c })
      expect(contrast(v['--brand-on-primary'], c), `button text on ${c}`).toBeGreaterThanOrEqual(3.2)
      expect(contrast(v['--brand-primary-ink'], '#EEEAE4'), `accent text ${c}`).toBeGreaterThanOrEqual(4)
      expect(contrast(v['--brand-primary-deep'], v['--brand-primary-soft']), `text on soft ${c}`).toBeGreaterThanOrEqual(4.5)
    }
  })
  it('mixes and darkens predictably', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080')
    expect(onColor('#F9B928')).not.toBe('#FFFFFF')
    expect(onColor('#172B3A')).toBe('#FFFFFF')
    expect(readableOn('#172B3A', '#FFFFFF')).toBe('#172B3A')
  })
})

describe('brand data', () => {
  it('the placeholder brand is BREND', () => expect(DEFAULT_BRAND.name).toBe('BREND'))
  it('replaces every invalid field on its own', () => {
    const b = sanitizeBrand({ name: '   ', primary: 'nope', secondary: '#101010', glass: 'x', backdrop: 'plain', showName: 'yes', logo: { src: 'https://evil.example/x.png', width: 1, height: 1 } })
    expect(b).toEqual({ ...DEFAULT_BRAND, secondary: '#101010', backdrop: 'plain' })
    expect(sanitizeBrand(null)).toEqual(DEFAULT_BRAND)
  })
  it('accepts only embedded raster/svg logos with real dimensions', () => {
    expect(sanitizeBrand({ logo: { src: PNG, width: 200, height: 50 } }).logo).toEqual({ src: PNG, width: 200, height: 50 })
    for (const logo of [{ src: PNG, width: 0, height: 5 }, { src: 'data:text/html;base64,AAAA', width: 1, height: 1 }, { src: 'javascript:alert(1)', width: 1, height: 1 }, { src: `data:image/png;base64,${'A'.repeat(800_000)}`, width: 1, height: 1 }])
      expect(sanitizeBrand({ logo }).logo).toBeNull()
  })
  it('trims and limits the name', () => {
    expect(cleanName('  Atlas   Moda ')).toBe('Atlas Moda')
    expect(cleanName('x'.repeat(100))).toHaveLength(NAME_MAX)
    expect(cleanName('')).toBeNull()
  })
})

describe('brand store', () => {
  it('saves per tenant, notifies at once and survives a reload', () => {
    const { data, kv } = memory()
    const a = createBrandStore({ namespace: 'core', tenantId: 'a', storage: () => kv })
    const b = createBrandStore({ namespace: 'core', tenantId: 'b', storage: () => kv })
    let calls = 0
    const off = a.subscribe(() => calls++)
    expect(a.update({ name: 'Atlas', primary: '#0f7b5f', logo: { src: PNG, width: 10, height: 5 } })).toBe(true)
    expect(calls).toBe(1)
    expect(a.get().primary).toBe('#0F7B5F')
    expect(b.get()).toEqual(DEFAULT_BRAND)
    expect([...data.keys()]).toEqual(['core:brand:a'])
    expect(createBrandStore({ namespace: 'core', tenantId: 'a', storage: () => kv }).get()).toEqual(a.get())
    a.update({ logo: null })
    expect(a.get().logo).toBeNull()
    expect(a.get().name).toBe('Atlas')
    a.update({ primary: 'zzz' })
    expect(a.get().primary).toBe('#0F7B5F')
    off()
    a.reset()
    expect(a.get()).toEqual(DEFAULT_BRAND)
    expect(data.size).toBe(0)
    expect(calls).toBe(3)
  })
  it('still applies a change when storage is full, and says it was not saved', () => {
    const s = createBrandStore({ namespace: 'n', tenantId: 't', storage: () => ({ getItem: () => null, removeItem: () => {}, setItem: () => { throw new Error('quota') } }) })
    expect(s.update({ name: 'Atlas' })).toBe(false)
    expect(s.get().name).toBe('Atlas')
  })
  it('falls back to the defaults on unreadable data', () => {
    const { data, kv } = memory()
    data.set('n:brand:t', '{broken')
    expect(createBrandStore({ namespace: 'n', tenantId: 't', storage: () => kv }).get()).toEqual(DEFAULT_BRAND)
  })
})

describe('brand name in the app', () => {
  it('replaces the placeholder in interface texts and catalog data, and nothing technical', () => {
    expect(t('home.original')).toBe('BREND Original')
    brandStore.update({ name: "Atlas $& Moda" })
    expect(t('home.original')).toBe('Atlas $& Moda Original')
    expect(brandText('@brend_demo BRD-1')).toBe('@brend_demo BRD-1')
    const data = withBrandName({ categories: [], products: [], outfits: [], settings: NO_SETTINGS, brands: [{ id: 'brend', name: 'BREND Original', type: 'original' }], banners: [{ id: 'b', title: 'BREND Original', subtitle: '', to: '/', tone: 'navy' }] })
    expect(data.brands[0]).toEqual({ id: 'brend', name: 'Atlas $& Moda Original', type: 'original' })
    expect(data.banners[0].title).toBe('Atlas $& Moda Original')
  })
  it('builds a safe letter icon, or uses the logo', () => {
    expect(decodeURIComponent(faviconFor({ ...DEFAULT_BRAND, name: '<script>' }))).not.toContain('<script')
    expect(faviconFor({ ...DEFAULT_BRAND, logo: { src: PNG, width: 1, height: 1 } })).toBe(PNG)
  })
})

describe('logo intake', () => {
  const svg = (body: string, attrs = 'viewBox="0 0 200 50"') => `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${body}</svg>`
  it('recognizes the format from the content', () => {
    expect(sniffLogo(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe('png')
    expect(sniffLogo(enc('RIFF0000WEBPVP8 '))).toBe('webp')
    expect(sniffLogo(enc(`<?xml version="1.0"?>\n${svg('<path d="M0 0"/>')}`))).toBe('svg')
    expect(sniffLogo(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull() // jpeg has no transparency
    expect(sniffLogo(enc('<html><body></body></html>'))).toBeNull()
  })
  it('accepts ordinary SVGs, including internal references', () => {
    expect(isSafeSvg(svg('<defs><linearGradient id="g"/></defs><rect fill="url(#g)"/><rect style="fill:url(\'#g\')"/><use href="#g"/><use xlink:href="#g"/>'))).toBe(true)
  })
  it('rejects SVGs with scripts, handlers or external content', () => {
    for (const body of ['<script>alert(1)</script>', '<rect onload="x()"/>', '<a href="javascript:x()"/>', '<image href="https://evil.example/a.png"/>', '<use xlink:href="//evil.example/#a"/>', '<foreignObject/>', '<style>@import "x.css";</style>', '<rect style="fill:url(https://evil.example/a)"/>', '<image href="data:image/svg+xml;base64,AAAA"/>'])
      expect(isSafeSvg(svg(body)), body).toBe(false)
    expect(isSafeSvg(`<!DOCTYPE svg [<!ENTITY a "b">]>${svg('')}`)).toBe(false)
  })
  it('keeps the proportions: size comes from width/height or the viewBox', () => {
    expect(svgSize(svg(''))).toEqual({ width: 200, height: 50, declared: false })
    expect(svgSize(svg('', 'width="30" height="10px"'))).toEqual({ width: 30, height: 10, declared: true })
    expect(withSvgSize(svg('', 'width="100%" viewBox="0 0 200 50"'))).toContain('<svg width="200" height="50"')
    expect(withSvgSize(svg('', 'width="100%" viewBox="0 0 200 50"'))).not.toContain('100%')
  })
  it('refuses wrong, huge and unsafe files with a reason', async () => {
    const code = (b: Blob) => readLogo(b).then(() => 'ok', (e) => (e as LogoError).code)
    expect(await code(new Blob(['hello']))).toBe('type')
    expect(await code(new Blob([new Uint8Array(5 * 1024 * 1024)]))).toBe('size')
    expect(await code(new Blob([svg('<script/>')]))).toBe('unsafe')
    expect(await code(new Blob([svg(`<!--${'a'.repeat(300_000)}-->`)]))).toBe('size')
  })
})
