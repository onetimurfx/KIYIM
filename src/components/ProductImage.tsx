import { useState } from 'react'
import { ImageOff, Shirt } from 'lucide-react'
import { photosOf, photoUrl, type Photo } from '../data/photos'
import { imageUrl } from '../lib/backend'

/**
 * One product picture. Order of preference: the shop's own upload (admin panel) -> the demo's catalogue photo ->
 * a neutral glass placeholder (also shown when the network cannot load the photo). Nothing is ever drawn or generated.
 */
interface Props {
  productId?: string
  /** storage paths of the shop's own photos */
  images?: string[]
  /** which picture of the product (gallery) */
  index?: number
  /** rendition size in CSS pixels; a 2x rendition is offered for sharp phone screens */
  width?: number
  height?: number
  /** load immediately (above the fold) */
  eager?: boolean
  className?: string
  label?: string
}

/** How many pictures a product has (uploads win over catalogue photos); at least 1, so there is always a frame. */
export const pictureCount = (productId: string, images?: string[]) => Math.max(1, images?.length || photosOf(productId).length)

export function ProductImage({ productId = '', images, index = 0, width = 200, height = 233, eager, className = '', label }: Props) {
  const own = images?.[index] ? imageUrl(images[index]) : null
  const photo: Photo | undefined = images?.length ? undefined : photosOf(productId)[index]
  return <Picture key={own ?? photo?.id ?? 'none'} own={own} photo={photo} width={width} height={height} eager={eager} className={className} label={label} />
}

export function Picture({ own, photo, width, height, eager, className = '', label }: { own?: string | null; photo?: Photo; width: number; height: number; eager?: boolean; className?: string; label?: string }) {
  const [state, setState] = useState<'loading' | 'ok' | 'bad'>('loading')
  const src = own ?? (photo ? photoUrl(photo, width, height) : null)
  if (!src || state === 'bad') {
    return (
      <span data-testid="photo-placeholder" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={`${className} photo-frame grid place-items-center text-navy/30`}>
        {src ? <ImageOff className="size-1/4 max-h-10 max-w-10" strokeWidth={1.4} /> : <Shirt className="size-1/4 max-h-10 max-w-10" strokeWidth={1.4} />}
      </span>
    )
  }
  return (
    <span className={`${className} photo-frame block overflow-hidden`} data-loading={state === 'loading' ? '' : undefined}>
      <img
        src={src}
        srcSet={own || !photo ? undefined : `${src} 1x, ${photoUrl(photo, width * 2, height * 2)} 2x`}
        alt={label ?? ''}
        aria-hidden={label ? undefined : true}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        // a picture that finished before React attached its listeners (cached) never fires onLoad
        ref={(el) => {
          if (el?.complete && el.naturalWidth > 0) setState('ok')
        }}
        onLoad={() => setState('ok')}
        onError={() => setState('bad')}
        style={photo?.focus ? { objectPosition: photo.focus } : undefined}
        className={`size-full object-cover transition-opacity duration-300 ${state === 'ok' ? 'opacity-100' : 'opacity-0'}`}
      />
    </span>
  )
}
