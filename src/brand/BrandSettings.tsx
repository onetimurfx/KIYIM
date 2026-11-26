/** The shop owner's brand editor. Every valid change is applied immediately. Self-contained: needs only a BrandStore. */
import { useEffect, useId, useState, type ReactNode } from 'react'
import { ImagePlus, RotateCcw, ShoppingBag, Trash2, Zap } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { normalizeHex } from './color'
import { NAME_MAX, PRESETS } from './defaults'
import { brandStore } from './instance'
import { LOGO_ACCEPT, LogoError, readLogo, type LogoErrorCode } from './logo'
import { useBrand } from './react'
import { cleanName, type BrandStore } from './store'
import type { Backdrop, GlassLevel } from './types'

const LOGO_ERRORS: Record<LogoErrorCode, string> = {
  type: 'Faqat PNG, SVG yoki WebP fayl yuklang.',
  size: "Fayl juda katta. PNG/WebP 4 MB gacha, SVG 200 KB gacha bo'lsin.",
  unsafe: "Bu SVG ichida skript yoki tashqi havola bor, xavfsizlik uchun qabul qilinmadi.",
  broken: "Faylni o'qib bo'lmadi. Boshqa fayl tanlang.",
}

const GLASS: { id: GlassLevel; label: string }[] = [
  { id: 'clear', label: 'Shaffof' },
  { id: 'balanced', label: "O'rtacha" },
  { id: 'solid', label: 'Quyuq' },
]
const BACKDROPS: { id: Backdrop; label: string }[] = [
  { id: 'aurora', label: 'Rangli' },
  { id: 'plain', label: 'Sokin' },
]

const field = 'glass-field w-full rounded-2xl px-3.5 py-3 text-[16px] text-navy outline-none focus:ring-2 focus:ring-primary'

export function BrandSettings({ store = brandStore, disabled = false }: { store?: BrandStore; disabled?: boolean }) {
  const brand = useBrand(store)
  const [name, setName] = useState(brand.name)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [unsaved, setUnsaved] = useState(false)
  const fileId = useId()
  // follow changes made elsewhere (reset, another tab) without fighting the field while the owner types
  useEffect(() => {
    setName((typed) => (cleanName(typed) === brand.name ? typed : brand.name))
  }, [brand.name])

  const update: BrandStore['update'] = (patch) => {
    const saved = store.update(patch)
    setUnsaved(!saved)
    return saved
  }

  const pickLogo = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setLogoError(null)
    try {
      update({ logo: await readLogo(file) })
    } catch (e) {
      setLogoError(LOGO_ERRORS[e instanceof LogoError ? e.code : 'broken'])
    } finally {
      setBusy(false)
    }
  }

  return (
    <fieldset disabled={disabled} data-testid="brand-settings" className="min-w-0 space-y-4 border-0 p-0">
      {unsaved && <p role="alert" className="rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger-deep">Brauzer xotirasi to'lgan yoki yopiq: o'zgarish faqat shu seansda saqlanadi.</p>}

      <Panel title="Ko'rinishi">
        <div data-testid="brand-preview" className="glass-card rounded-3xl p-3.5">
          <BrandMark brand={brand} height={36} />
          <div className="mt-3 flex flex-wrap items-center gap-2" aria-hidden>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-[13px] font-bold text-on-primary">
              <Zap className="size-4" fill="currentColor" /> Asosiy
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2.5 text-[13px] font-bold text-on-secondary">
              <ShoppingBag className="size-4" /> Qo'shimcha
            </span>
            <span className="text-[13px] font-extrabold text-primary-ink">Havola matni</span>
          </div>
        </div>
      </Panel>

      <Panel title="Nom va logotip">
        <label className="block">
          <span className="mb-1 block text-[13px] font-semibold text-navy-soft">Brend nomi</span>
          <input
            data-testid="brand-name-input"
            value={name}
            maxLength={NAME_MAX}
            onChange={(e) => {
              setName(e.target.value)
              const clean = cleanName(e.target.value)
              if (clean) update({ name: clean })
            }}
            onBlur={() => setName(store.get().name)}
            className={field}
          />
        </label>

        <div>
          <span className="mb-1 block text-[13px] font-semibold text-navy-soft">Logotip</span>
          {brand.logo && (
            // the checkerboard only visualises transparency here; the app itself never paints behind the logo
            <div className="checkerboard mb-2 grid h-28 place-items-center rounded-2xl p-3">
              <img data-testid="brand-logo-preview" src={brand.logo.src} alt="Yuklangan logotip" className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <label htmlFor={fileId} className="glass-pill inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 text-[13.5px] font-bold">
              <ImagePlus className="size-4" />
              {busy ? 'Yuklanmoqda…' : brand.logo ? 'Almashtirish' : 'Logotip yuklash'}
            </label>
            <input
              id={fileId}
              data-testid="brand-logo-input"
              type="file"
              accept={LOGO_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                void pickLogo(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            {brand.logo && (
              <button type="button" data-testid="brand-logo-remove" onClick={() => update({ logo: null })} className="glass-pill inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-[13.5px] font-bold text-primary-deep">
                <Trash2 className="size-4" /> O'chirish
              </button>
            )}
          </div>
          <p className="mt-1.5 text-[12px] text-navy-soft">PNG, SVG yoki WebP. Shaffof fon saqlanadi, proporsiya o'zgarmaydi.</p>
          {logoError && <p role="alert" data-testid="brand-logo-error" className="mt-1.5 text-[13px] font-semibold text-danger-deep">{logoError}</p>}
          {brand.logo && (
            <label className="mt-2 flex min-h-11 items-center gap-3 text-[14px]">
              <input data-testid="brand-show-name" type="checkbox" checked={brand.showName} onChange={(e) => update({ showName: e.target.checked })} className="size-5 accent-primary" />
              Logotip yonida nom ham ko'rinsin
            </label>
          )}
        </div>
      </Panel>

      <Panel title="Ranglar">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const on = brand.primary === p.primary && brand.secondary === p.secondary && brand.nameColor === p.nameColor
            return (
              <button key={p.id} type="button" data-testid={`brand-preset-${p.id}`} aria-pressed={on} onClick={() => update({ primary: p.primary, secondary: p.secondary, nameColor: p.nameColor })} className={`glass-pill inline-flex min-h-10 items-center gap-2 rounded-full pl-2 pr-3.5 text-[13px] font-bold ${on ? 'ring-2 ring-primary' : ''}`}>
                <span className="flex -space-x-1.5" aria-hidden>
                  <span className="size-6 rounded-full border border-white" style={{ background: p.primary }} />
                  <span className="size-6 rounded-full border border-white" style={{ background: p.secondary }} />
                </span>
                {p.label}
              </button>
            )
          })}
        </div>
        <ColorField id="primary" label="Asosiy rang" value={brand.primary} onChange={(v) => update({ primary: v })} />
        <ColorField id="secondary" label="Qo'shimcha rang" value={brand.secondary} onChange={(v) => update({ secondary: v })} />
        <ColorField id="nameColor" label="Nom (yozuv) rangi" value={brand.nameColor} onChange={(v) => update({ nameColor: v })} />
      </Panel>

      <Panel title="Interfeys uslubi">
        <Segmented label="Shisha effekti" id="glass" options={GLASS} value={brand.glass} onChange={(glass) => update({ glass })} />
        <Segmented label="Fon" id="backdrop" options={BACKDROPS} value={brand.backdrop} onChange={(backdrop) => update({ backdrop })} />
      </Panel>

      <button
        type="button"
        data-testid="brand-reset"
        onClick={() => {
          store.reset()
          setName(store.get().name)
          setLogoError(null)
          setUnsaved(false)
        }}
        className="glass-pill flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-bold"
      >
        <RotateCcw className="size-4" /> Standart brendga qaytarish
      </button>
    </fieldset>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass-card space-y-3 rounded-3xl p-4">
      <h2 className="text-[17px]">{title}</h2>
      {children}
    </section>
  )
}

function ColorField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  useEffect(() => {
    setText((typed) => (normalizeHex(typed) === value ? typed : value))
  }, [value])
  return (
    <div className="flex items-center gap-3">
      <input type="color" aria-label={label} data-testid={`brand-${id}-picker`} value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="glass-field size-12 shrink-0 cursor-pointer rounded-2xl p-1" />
      <label className="min-w-0 flex-1">
        <span className="mb-0.5 block text-[12.5px] font-semibold text-navy-soft">{label}</span>
        <input
          data-testid={`brand-${id}-hex`}
          value={text}
          maxLength={7}
          spellCheck={false}
          autoCapitalize="characters"
          onChange={(e) => {
            setText(e.target.value)
            // only complete 6-digit codes are applied while typing; the short form is accepted on blur
            if (/^#?[0-9a-fA-F]{6}$/.test(e.target.value.trim())) onChange(normalizeHex(e.target.value)!)
          }}
          onBlur={() => {
            const hex = normalizeHex(text)
            if (hex) onChange(hex)
            setText(hex ?? value)
          }}
          className={`${field} py-2 font-mono uppercase`}
        />
      </label>
    </div>
  )
}

function Segmented<T extends string>({ id, label, options, value, onChange }: { id: string; label: string; options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div>
      <span className="mb-1 block text-[13px] font-semibold text-navy-soft">{label}</span>
      <div role="radiogroup" aria-label={label} className="glass-field flex gap-1 rounded-full p-1">
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} data-testid={`brand-${id}-${o.id}`} onClick={() => onChange(o.id)} className={`min-h-10 flex-1 rounded-full text-[13px] font-bold transition-colors ${value === o.id ? 'bg-secondary text-on-secondary' : ''}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
