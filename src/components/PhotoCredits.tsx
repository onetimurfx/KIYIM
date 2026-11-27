import { Camera } from 'lucide-react'
import { allPhotos } from '../data/photos'

/** Credit for the demo photography (not required by the Unsplash License, shown as good practice). */
export function PhotoCredits() {
  const authors = new Map(allPhotos().map((p) => [p.author, p.page]))
  return (
    <details data-testid="photo-credits" className="glass-card mx-4 mt-4 rounded-2xl px-4 py-3 text-[13px] text-navy-soft">
      <summary className="flex min-h-7 cursor-pointer items-center gap-3 font-semibold">
        <Camera className="size-5 text-primary-ink" />
        Rasmlar manbasi
      </summary>
      <p className="mt-2 text-[12px]">Namuna suratlar Unsplash'dan (Unsplash License). Ular haqiqiy do'kon mahsulotlari emas.</p>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {[...authors].map(([author, page]) => (
          <a key={author} href={page} target="_blank" rel="noreferrer" className="underline underline-offset-2">
            {author}
          </a>
        ))}
      </p>
    </details>
  )
}
