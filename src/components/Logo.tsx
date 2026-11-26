/** Text-only wordmark: the word "BREND" in the brand yellow. No graphic logo. `className` keeps the old height classes (h-9, h-10). */
const WORDMARK = 'BREND'
const BRAND_YELLOW = '#F9B928'

export function Logo({ className = 'h-9' }: { className?: string }) {
  // Tailwind height unit = 4px; the glyphs take about 68% of the box height, like the previous wordmark did.
  const units = Number(/(?:^|\s)h-(\d+)(?:\s|$)/.exec(className)?.[1] ?? 9)
  return (
    <span
      data-testid="brand-wordmark"
      className={`${className} inline-flex w-auto select-none items-center font-extrabold leading-none tracking-tight`}
      style={{ color: BRAND_YELLOW, fontSize: `${Math.round(units * 4 * 0.68)}px` }}
    >
      {WORDMARK}
    </span>
  )
}
