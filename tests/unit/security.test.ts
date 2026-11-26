/** Hygiene: the demo has no server, so no secret, key or network call may exist in the source or in the built bundle. */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const walk = (dir: string): string[] =>
  existsSync(dir) ? readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p] }) : []
const text = (f: string) => (/\.(js|css|html|ts|tsx|json|svg|map|webmanifest)$/.test(f) ? readFileSync(f, 'utf8') : '')
const sources = walk(resolve('src')).filter((x) => /\.(ts|tsx)$/.test(x))

describe('demo has no secrets and no server', () => {
  it('src and dist contain no token, key or private key', () => {
    for (const f of [...walk(resolve('src')), ...walk(resolve('dist'))]) {
      const s = text(f)
      expect(/\b\d{8,10}:[A-Za-z0-9_-]{35}\b/.test(s), `bot token in ${f}`).toBe(false)
      expect(/SERVICE_ROLE|BOT_TOKEN|CRON_SECRET|-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(s), `secret in ${f}`).toBe(false)
    }
  })
  it('the source never calls the network or reads env variables', () => {
    for (const f of sources) {
      const s = readFileSync(f, 'utf8')
      expect(/\bfetch\(|XMLHttpRequest|supabase/i.test(s), `network/supabase in ${f}`).toBe(false)
      expect(/VITE_(?!DELIVERY_)[A-Z_]+/.test(s), `env var in ${f}`).toBe(false)
    }
  })
  it('the old brand names appear nowhere in the source', () => {
    for (const f of [...sources, ...walk(resolve('public')).filter((x) => /\.(svg|json|html)$/.test(x)), resolve('index.html')]) expect(/aynimo|angar/i.test(readFileSync(f, 'utf8')), f).toBe(false)
  })
})

describe('repository', () => {
  it('ignores local env files', () => expect(/^\.env/m.test(readFileSync('.gitignore', 'utf8'))).toBe(true))
})
