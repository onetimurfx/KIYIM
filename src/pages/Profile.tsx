import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Headset, PackageOpen, Palette, RotateCcw, ShieldCheck, UserRound } from 'lucide-react'
import { PageHeader, Section } from '../components/ui'
import { ProductRail } from '../components/ProductCard'
import { getProduct, settings } from '../data/catalog'
import { useBackend, useCatalogVersion } from '../lib/backendContext'
import { getTelegramUser, isInTelegram } from '../lib/telegram'
import { DraftBadge } from '../components/NoticeBanner'
import { useOrders } from '../lib/ordersStore'
import { usePickup } from '../lib/pickupStore'
import { StatusChip } from '../components/PickupStatus'
import { formatUZS } from '../lib/format'
import { useRecent } from '../lib/recent'
import { t } from '../i18n'
import { brandText, useBrand } from '../brand'
import { PhotoCredits } from '../components/PhotoCredits'
import { isDemoAdmin, resetDemo, setDemoAdmin } from '../demo/db'

/** Demo tools: enter the demo admin panel and start over with the original demo data. */
function DemoCard() {
  const nav = useNavigate()
  const [admin, setAdmin] = useState(isDemoAdmin())
  const [confirm, setConfirm] = useState(false)
  return (
    <section data-testid="demo-card" className="glass mt-4 rounded-2xl px-4 py-3.5">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary-ink">Demo rejim</p>
      <p className="mt-1 text-[12.5px] leading-snug text-navy-soft">Barcha ma'lumotlar faqat shu qurilmada saqlanadi. Buyurtmalar, ombor va admin o'zgarishlari bir-biriga bog'liq ishlaydi.</p>
      <button
        type="button"
        data-testid="admin-link"
        onClick={() => {
          setDemoAdmin(true)
          setAdmin(true)
          nav('/admin')
        }}
        className="mt-3 flex w-full items-center gap-3 rounded-2xl glass-card px-3 py-3 text-left active:scale-[0.99]"
      >
        <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary-ink"><ShieldCheck className="size-5" /></span>
        <span className="min-w-0 flex-1 text-[14px] font-bold">Demo admin panelga kirish</span>
        <ChevronRight className="size-4 text-stone" />
      </button>
      <button
        type="button"
        data-testid="brand-link"
        onClick={() => {
          setDemoAdmin(true)
          setAdmin(true)
          nav('/admin/brand')
        }}
        className="glass-pill mt-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left active:scale-[0.99]"
      >
        <span className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary-ink"><Palette className="size-5" /></span>
        <span className="min-w-0 flex-1 text-[14px] font-bold">Brendni sozlash<span className="block text-[12px] font-medium text-navy-soft">Nom, logotip, ranglar</span></span>
        <ChevronRight className="size-4 text-stone" />
      </button>
      {admin && (
        <button type="button" data-testid="admin-off" onClick={() => { setDemoAdmin(false); setAdmin(false) }} className="mt-2 w-full rounded-full px-3 py-2 text-[12.5px] font-semibold text-navy-soft">
          Admin rejimidan chiqish
        </button>
      )}
      {confirm && <p className="mt-2 text-center text-[12px] text-navy-soft">Buyurtmalar, rasmlar va brend sozlamalari boshlang'ich holatga qaytadi.</p>}
      {confirm ? (
        <div className="mt-2 flex items-center gap-2">
          <button type="button" data-testid="demo-reset-yes" onClick={() => { resetDemo(); window.location.reload() }} className="flex-1 rounded-full bg-primary px-3 py-2.5 text-[13px] font-bold text-on-primary">Ha, tozalash</button>
          <button type="button" onClick={() => setConfirm(false)} className="flex-1 rounded-full glass-card px-3 py-2.5 text-[13px] font-bold">Bekor qilish</button>
        </div>
      ) : (
        <button type="button" data-testid="demo-reset" onClick={() => setConfirm(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full px-3 py-2 text-[12.5px] font-semibold text-navy-soft">
          <RotateCcw className="size-3.5" /> Demoni boshidan boshlash
        </button>
      )}
    </section>
  )
}

export function Profile() {
  const user = getTelegramUser()
  useBrand()
  useCatalogVersion()
  const { mode, auth } = useBackend()
  const { orders, status, refresh } = useOrders()
  const pickup = usePickup()
  const server = mode === 'server'
  const recent = useRecent().map(getProduct).filter((p) => p !== undefined)
  const name = user ? [user.first_name, user.last_name].filter(Boolean).join(' ') : brandText('BREND mijozi')

  return (
    <div className="pb-36">
      <PageHeader title={t('profile.title')} />
      <div className="px-4">
        <div className="glass flex items-center gap-4 rounded-[28px] p-4">
          {user?.photo_url ? (
            <img src={user.photo_url} alt="" className="size-16 rounded-full object-cover" />
          ) : (
            <div className="grid size-16 place-items-center rounded-full bg-primary-soft text-primary-ink">
              <UserRound className="size-7" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{name}</p>
            {user?.username && <p className="text-sm text-navy-soft">@{user.username}</p>}
          </div>
        </div>
        <p className="mt-2 px-1 text-[12px] text-stone">{server && auth === 'ok' ? t('profile.tgVerified') : isInTelegram() ? t('profile.tgNote') : t('profile.preview')}</p>

        <DemoCard />

        <h2 className="mb-2 mt-7 text-xl">{t('profile.pickupTitle')}</h2>
        <section data-testid="pickup-history">
          {!server ? (
            <p data-testid="pickup-demo" role="note" className="rounded-2xl glass-card px-4 py-4 text-sm text-navy-soft">{t('profile.pickupDemo')}</p>
          ) : pickup.status === 'unauth' ? (
            <p role="note" className="rounded-2xl glass-card px-4 py-4 text-sm text-navy-soft">{t('profile.authNeeded')}</p>
          ) : pickup.status === 'error' ? (
            <div role="alert" data-testid="pickup-history-error" className="flex items-center justify-between gap-3 rounded-2xl bg-danger-soft px-4 py-4 text-sm font-semibold text-danger-deep">
              <span>{t('order.loadFailed')}</span>
              <button type="button" onClick={pickup.refresh} className="rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-on-primary">{t('profile.retry')}</button>
            </div>
          ) : pickup.status === 'loading' || pickup.status === 'idle' ? (
            <p role="status" className="rounded-2xl glass-card px-4 py-4 text-sm text-navy-soft">{t('order.loading')}</p>
          ) : pickup.orders.length === 0 ? (
            <div data-testid="pickup-empty" className="flex items-center gap-3 rounded-2xl glass-card px-4 py-4 text-sm text-navy-soft">
              <PackageOpen className="size-5 text-primary-ink" />
              {t('profile.pickupEmpty')}
            </div>
          ) : (
            <>
              <p className="mb-2 text-[12.5px] text-navy-soft">{t('profile.pickupHint')}</p>
              <ul className="space-y-2.5">
                {pickup.orders.map((o) => (
                  <li key={o.id}>
                    <Link to={`/tezkor-buyurtma/${o.id}`} data-testid="pickup-history-item" data-status={o.status} className="flex items-center gap-3 rounded-2xl glass-card px-4 py-3.5 active:scale-[0.99]">
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-extrabold tracking-wide tabular-nums">{o.orderNumber}</p>
                        <p className="mt-0.5 text-[12.5px] text-navy-soft">
                          {new Date(o.createdAt).toLocaleDateString('uz-UZ')} · {o.items.reduce((n, i) => n + i.qty, 0)} {t('cart.line')} · {formatUZS(o.total)}
                        </p>
                        <StatusChip status={o.status} className="mt-1.5" />
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-stone" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <h2 className="mb-2 mt-7 text-xl">{t('profile.orders')}</h2>
        {server && status === 'unauth' ? (
          <p data-testid="orders-unauth" role="note" className="rounded-2xl glass-card px-4 py-4 text-sm text-navy-soft">{t('profile.authNeeded')}</p>
        ) : server && status === 'error' ? (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-danger-soft px-4 py-4 text-sm font-semibold text-danger-deep">
            <span>{t('order.loadFailed')}</span>
            <button type="button" onClick={refresh} className="rounded-full bg-danger px-4 py-2 text-[13px] font-bold text-white">{t('profile.retry')}</button>
          </div>
        ) : server && status === 'loading' ? (
          <p role="status" className="rounded-2xl glass-card px-4 py-4 text-sm text-navy-soft">{t('order.loading')}</p>
        ) : orders.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl glass-card px-4 py-4 text-sm text-navy-soft">
            <PackageOpen className="size-5 text-primary-ink" />
            {t('profile.ordersEmpty')}
          </div>
        ) : (
          <>
            <p className="mb-2 text-[12.5px] text-navy-soft">{server ? t('profile.ordersHintServer') : t('profile.ordersHint')}</p>
            <ul className="space-y-2.5">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link to={`/buyurtma/${o.id}`} data-testid="profile-order" className="flex items-center gap-3 rounded-2xl glass-card px-4 py-3.5 active:scale-[0.99]">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-extrabold tracking-wide tabular-nums">{o.ref}</p>
                      <p className="mt-0.5 text-[12.5px] text-navy-soft">
                        {new Date(o.createdAt).toLocaleDateString('uz-UZ')} · {o.items.reduce((n, i) => n + i.qty, 0)} {t('cart.line')} · {formatUZS(o.total)}
                      </p>
                      {o.sync === 'server' ? <span className="mt-1.5 inline-block rounded-full bg-[#e8f1df]/75 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#2f4a1f]">{t(`order.status.${o.status ?? 'new'}`)}</span> : <DraftBadge className="mt-1.5" />}
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-stone" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="mb-2 mt-7 text-xl">{t('profile.support')}</h2>
        <div className="flex items-center gap-3 rounded-2xl glass-card px-4 py-4 text-sm text-navy-soft">
          <Headset className="size-5 text-primary-ink" />
          {settings.supportContact ?? t('profile.supportEmpty')}
        </div>
      </div>
      <PhotoCredits />
      {recent.length > 0 && (
        <Section title={t('home.recent')}>
          <ProductRail items={recent} />
        </Section>
      )}
    </div>
  )
}
