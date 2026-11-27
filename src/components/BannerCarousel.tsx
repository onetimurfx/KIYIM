import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { banners } from '../data/catalog'
import type { Banner } from '../data/types'
import { BANNER_PHOTOS } from '../data/photos'
import { Picture } from './ProductImage'

/** tint laid over the photograph */
const TONES: Record<Banner['tone'], string> = {
  coral: 'from-primary/55',
  navy: 'from-secondary/60',
  beige: 'from-beige/45',
}

export function BannerCarousel() {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const paused = useRef(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = window.setInterval(() => {
      const el = ref.current
      if (!el || paused.current) return
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % banners.length
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
    }, 4500)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div>
      <div
        ref={ref}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        onTouchStart={() => (paused.current = true)}
        onTouchEnd={() => window.setTimeout(() => (paused.current = false), 6000)}
        aria-roledescription="carousel"
        aria-label="Aksiyalar"
      >
        {banners.map((b, i) => (
          <div key={b.id} className="w-full flex-none snap-center px-4">
            <Link to={b.to} className="relative flex h-[216px] flex-col justify-end overflow-hidden rounded-[30px] border border-white/70 shadow-[0_18px_34px_-20px_rgb(23_43_58/0.7)]">
              <Picture photo={BANNER_PHOTOS[b.id]} width={488} height={216} eager={i === 0} className="absolute inset-0 size-full" />
              <span aria-hidden className={`absolute inset-0 bg-gradient-to-tr to-transparent ${TONES[b.tone]}`} />
              <span className="glass-photo relative m-3 block rounded-[22px] px-4 py-3">
                <span className="line-clamp-2 font-display text-[22px] font-semibold leading-tight [overflow-wrap:anywhere]">{b.title}</span>
                <span className="mt-0.5 line-clamp-2 text-[12.5px] text-navy-soft [overflow-wrap:anywhere]">{b.subtitle}</span>
              </span>
              <span className="glass-chip absolute right-3 top-3 grid size-9 place-items-center rounded-full text-navy">
                <ArrowUpRight className="size-[18px]" />
              </span>
            </Link>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
        {banners.map((b, i) => (
          <span key={b.id} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-primary' : 'w-1.5 bg-navy/20'}`} />
        ))}
      </div>
    </div>
  )
}
