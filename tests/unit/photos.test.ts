import { describe, expect, it } from 'vitest'
import { allPhotos, BANNER_PHOTOS, PRODUCT_PHOTOS, photosOf, photoUrl } from '../../src/data/photos'
import { buildSeed } from '../../src/demo/seed'

const seed = buildSeed(Date.UTC(2026, 0, 15))

describe('catalogue photography', () => {
  it('every demo product and banner has a photo, and no photo is orphaned', () => {
    for (const p of seed.products) expect(photosOf(p.id).length, p.id).toBeGreaterThan(0)
    for (const b of seed.banners) expect(BANNER_PHOTOS[b.id], b.id).toBeDefined()
    expect(Object.keys(PRODUCT_PHOTOS).filter((id) => !seed.products.some((p) => p.id === id))).toEqual([])
  })
  it('uses only free Unsplash CDN photos with a credit', () => {
    for (const p of allPhotos()) {
      expect(p.id).toMatch(/^photo-\d+-[0-9a-f]+$/) // premium Unsplash+ ids start with "premium_photo-"
      expect(p.page).toMatch(/^https:\/\/unsplash\.com\/photos\//)
      expect(p.author.length).toBeGreaterThan(0)
      expect(photoUrl(p, 160, 187)).toBe(`https://images.unsplash.com/${p.id}?auto=format&fit=crop&w=160&h=187&q=72`)
    }
  })
  it('never shows the same photo for two things', () => {
    const ids = allPhotos().map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
