import { describe, expect, it } from 'vitest'
import { contrast, isWeakFill, isWeakName, SURFACE } from '../../src/brand/color'
import { DEFAULT_BRAND, PRESETS } from '../../src/brand/defaults'
import { themeVars } from '../../src/brand/theme'
import { isLowPowerDevice } from '../../src/lib/performance'

describe('very light brand colours', () => {
  it('leaves the default brand and every preset as designed', () => {
    for (const b of [DEFAULT_BRAND, ...PRESETS]) {
      expect([isWeakFill(b.primary), isWeakFill(b.secondary), isWeakName(b.nameColor)]).toEqual([false, false, false])
    }
  })
  it.each(['#FFFFFF', '#FFE600', '#F8BBD0', '#E0F7FA', '#F9B928'])('flags %s as too light for a filled control', (c) => {
    expect(isWeakFill(c)).toBe(true)
  })
  it('keeps the chosen colour and derives an edge that stands out', () => {
    for (const c of ['#FFFFFF', '#FFE600', '#F8BBD0']) {
      const v = themeVars({ ...DEFAULT_BRAND, primary: c, secondary: c })
      expect(v['--brand-primary']).toBe(c)
      expect(contrast(v['--brand-primary-edge'], SURFACE)).toBeGreaterThanOrEqual(3)
      expect(contrast(v['--brand-secondary-edge'], SURFACE)).toBeGreaterThanOrEqual(3)
      expect(contrast(v['--brand-on-primary'], c)).toBeGreaterThanOrEqual(4.5)
    }
  })
  it('warns about a wordmark that disappears, not about the yellow placeholder', () => {
    expect(isWeakName('#FFFFFF')).toBe(true)
    expect(isWeakName('#FFE600')).toBe(true)
    expect(isWeakName(DEFAULT_BRAND.nameColor)).toBe(false)
  })
})

describe('weak phone detection', () => {
  const tg = (cls: string) => `Mozilla/5.0 (Linux; Android 14) Mobile Telegram-Android/11.3.3 (Samsung SM-A055F; Android 14; SDK 34; ${cls})`
  it('trusts the performance class Telegram for Android reports', () => {
    expect(isLowPowerDevice({ userAgent: tg('LOW'), deviceMemory: 8, hardwareConcurrency: 8 })).toBe(true)
    expect(isLowPowerDevice({ userAgent: tg('HIGH'), deviceMemory: 2, hardwareConcurrency: 4 })).toBe(false)
  })
  it('falls back to memory and cores', () => {
    expect(isLowPowerDevice({ userAgent: tg('AVERAGE'), deviceMemory: 2 })).toBe(true)
    expect(isLowPowerDevice({ userAgent: 'x', deviceMemory: 4, hardwareConcurrency: 4 })).toBe(true)
    expect(isLowPowerDevice({ userAgent: 'x', deviceMemory: 4, hardwareConcurrency: 8 })).toBe(false)
    expect(isLowPowerDevice({ userAgent: 'x', deviceMemory: 8, hardwareConcurrency: 4 })).toBe(false)
  })
  it('keeps the full effect when the browser says nothing (iPhone)', () => {
    expect(isLowPowerDevice({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', hardwareConcurrency: 4 })).toBe(false)
  })
})
