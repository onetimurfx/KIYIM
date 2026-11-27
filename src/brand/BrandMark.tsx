import type { BrandConfig } from './types'

/**
 * The brand as it appears in a header: logo (own proportions, no background) and/or the text wordmark.
 * `height` is the box height in px; the logo is never stretched or cropped.
 */
export function BrandMark({ brand, height = 36, maxWidth = 168 }: { brand: BrandConfig; height?: number; maxWidth?: number }) {
  const showName = !brand.logo || brand.showName
  return (
    <span data-testid="brand-mark" className="inline-flex min-w-0 select-none items-center gap-2" style={{ height }}>
      {brand.logo && (
        <img
          data-testid="brand-logo"
          src={brand.logo.src}
          alt={showName ? '' : brand.name}
          width={brand.logo.width}
          height={brand.logo.height}
          className={`block object-contain object-left ${showName ? 'shrink-0' : 'min-w-0'}`}
          style={{ height, width: 'auto', maxWidth: showName ? Math.min(maxWidth, 96) : maxWidth }}
        />
      )}
      {showName && (
        <span data-testid="brand-wordmark" className="truncate font-extrabold leading-none tracking-tight" style={{ color: 'var(--brand-name)', fontSize: Math.round(height * (brand.logo ? 0.5 : 0.68)), maxWidth, paddingBlock: 2 }}>
          {brand.name}
        </span>
      )}
    </span>
  )
}
