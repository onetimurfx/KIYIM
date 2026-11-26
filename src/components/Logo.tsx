import { BrandMark, useBrand } from '../brand'

/** The shop's brand as set in Admin → Brend. `className` keeps the old height classes (h-9, h-10). */
export function Logo({ className = 'h-9' }: { className?: string }) {
  // Tailwind height unit = 4px
  const units = Number(/(?:^|\s)h-(\d+)(?:\s|$)/.exec(className)?.[1] ?? 9)
  const brand = useBrand()
  return <BrandMark brand={brand} height={units * 4} />
}
