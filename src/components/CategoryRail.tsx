import { Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { photosOf } from '../data/photos'
import type { Category, Product } from '../data/types'
import { t } from '../i18n'
import { Picture, ProductImage } from './ProductImage'

/** Category cards: a photo from the category with a glass caption. */
export function CategoryRail({ categories, products }: { categories: Category[]; products: Product[] }) {
  return (
    <nav className="rail mt-4 !gap-2.5" aria-label={t('home.categories')}>
      {categories.map((c) => {
        // the most popular product of the category that has a picture
        const cover = c.id === 'all' ? undefined : products.filter((p) => p.categoryId === c.id).sort((a, b) => b.popularity - a.popularity).find((p) => p.images?.length || photosOf(p.id).length)
        return (
          <Link key={c.id} to={c.id === 'all' ? '/katalog' : `/katalog?cat=${c.id}`} data-testid="category-card" className="glass-card relative block h-[128px] w-[104px] overflow-hidden rounded-[24px] p-1 transition-transform active:scale-[0.97]">
            {cover ? (
              <ProductImage productId={cover.id} images={cover.images} width={104} height={128} className="size-full rounded-[20px]" />
            ) : c.id === 'all' ? (
              <span className="grid size-full place-items-center rounded-[20px] bg-primary-soft/70 pb-6 text-primary-deep">
                <LayoutGrid className="size-7" strokeWidth={1.7} />
              </span>
            ) : (
              <Picture width={104} height={128} className="size-full rounded-[20px]" />
            )}
            <span className="glass-chip absolute inset-x-1.5 bottom-1.5 line-clamp-2 rounded-2xl px-1.5 py-1 text-center text-[11px] font-bold leading-tight">{c.id === 'all' ? t('common.all') : c.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
