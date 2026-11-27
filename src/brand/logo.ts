/**
 * Logo intake. Accepts PNG, WebP and SVG (formats that can be transparent), keeps the proportions and the transparency,
 * and never paints a background. The result is a data URL that is only ever shown through <img>, where SVG cannot run
 * scripts; SVG files with active or external content are rejected anyway (defence in depth for a multi-tenant future).
 */
import type { BrandLogo } from './types'

export const LOGO_ACCEPT = '.png,.svg,.webp,image/png,image/svg+xml,image/webp'
export const MAX_FILE_BYTES = 4 * 1024 * 1024
export const MAX_SVG_BYTES = 200 * 1024
/** longest data URL kept in storage */
export const MAX_DATA_URL = 700_000
const MAX_SIDE = 640

export type LogoErrorCode = 'type' | 'size' | 'unsafe' | 'broken'
export class LogoError extends Error {
  code: LogoErrorCode
  constructor(code: LogoErrorCode) {
    super(code)
    this.code = code
  }
}

export type LogoKind = 'png' | 'webp' | 'svg'

/** Decides the format from the CONTENT (a renamed file must not get through). */
export function sniffLogo(bytes: Uint8Array): LogoKind | null {
  if (bytes.length > 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return 'png'
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))
  if (bytes.length > 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  const head = new TextDecoder().decode(bytes.slice(0, 4096)).replace(/^﻿/, '').trimStart()
  if (head.startsWith('<') && /<svg[\s>/]/i.test(head)) return 'svg'
  return null
}

export function isSafeSvg(text: string): boolean {
  const banned = [
    /<script[\s>/]/i,
    /<foreignObject[\s>/]/i,
    /<(iframe|object|embed|audio|video)[\s>/]/i,
    /<!ENTITY/i,
    /[\s"'/]on[a-z]+\s*=/i, // event handlers
    /javascript\s*:/i,
    /(?:xlink:)?href\s*=\s*["'](?!\s*(?:#|data:image\/(?:png|jpe?g|webp|gif);))/i, // anything that points outside the file
    /url\((?!\s*["']?\s*(?:#|data:))/i,
    /@import/i,
  ]
  return /<svg[\s>/]/i.test(text) && /<\/svg\s*>|<svg[^>]*\/>/i.test(text) && !banned.some((re) => re.test(text))
}

/** Size of an SVG from width/height or, failing that, its viewBox; null if it declares neither. */
export function svgSize(text: string): { width: number; height: number; declared: boolean } | null {
  const tag = /<svg\b[^>]*>/i.exec(text)?.[0]
  if (!tag) return null
  const attr = (n: string) => new RegExp(`\\s${n}\\s*=\\s*["']\\s*([\\d.]+)(?:px)?\\s*["']`, 'i').exec(tag)?.[1]
  const w = Number(attr('width'))
  const h = Number(attr('height'))
  if (w > 0 && h > 0) return { width: w, height: h, declared: true }
  const box = /\sviewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i.exec(tag)
  if (box && Number(box[1]) > 0 && Number(box[2]) > 0) return { width: Number(box[1]), height: Number(box[2]), declared: false }
  return null
}

/** Some webviews give an SVG without width/height a wrong box: write the viewBox size onto the root element. */
export function withSvgSize(text: string): string {
  const size = svgSize(text)
  if (!size || size.declared) return text
  return text.replace(/<svg\b[^>]*>/i, (tag) => tag.replace(/\s(width|height)\s*=\s*(["'])[^"']*\2/gi, '').replace(/<svg/i, `<svg width="${size.width}" height="${size.height}"`))
}

const base64 = (bytes: Uint8Array) => {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new LogoError('broken'))
    img.src = src
  })

export async function readLogo(file: Blob): Promise<BrandLogo> {
  if (file.size > MAX_FILE_BYTES) throw new LogoError('size')
  const bytes = new Uint8Array(await file.arrayBuffer())
  const kind = sniffLogo(bytes)
  if (!kind) throw new LogoError('type')

  if (kind === 'svg') {
    if (bytes.length > MAX_SVG_BYTES) throw new LogoError('size')
    const text = new TextDecoder().decode(bytes)
    if (!isSafeSvg(text)) throw new LogoError('unsafe')
    const src = `data:image/svg+xml;base64,${base64(new TextEncoder().encode(withSvgSize(text)))}`
    const img = await loadImage(src)
    const size = svgSize(text) ?? { width: img.naturalWidth || 300, height: img.naturalHeight || 150 }
    return { src, width: size.width, height: size.height }
  }

  const original = `data:image/${kind};base64,${base64(bytes)}`
  const img = await loadImage(original)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (!w || !h) throw new LogoError('broken')
  if (Math.max(w, h) <= MAX_SIDE && original.length <= MAX_DATA_URL) return { src: original, width: w, height: h }
  // shrink (same proportions) into a PNG, which keeps the transparent pixels transparent
  for (let side = MAX_SIDE; side >= 160; side = Math.round(side * 0.75)) {
    const k = Math.min(1, side / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(w * k))
    canvas.height = Math.max(1, Math.round(h * k))
    const g = canvas.getContext('2d')
    if (!g) throw new LogoError('broken')
    g.drawImage(img, 0, 0, canvas.width, canvas.height)
    const src = canvas.toDataURL('image/png')
    if (src.length <= MAX_DATA_URL) return { src, width: canvas.width, height: canvas.height }
  }
  throw new LogoError('size')
}
