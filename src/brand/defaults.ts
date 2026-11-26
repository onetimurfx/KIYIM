import type { BrandConfig } from './types'

/** The demo placeholder brand. A tenant overrides any of these values. */
export const DEFAULT_BRAND: BrandConfig = {
  v: 1,
  name: 'BREND',
  logo: null,
  showName: true,
  primary: '#D94B59',
  secondary: '#172B3A',
  nameColor: '#F9B928',
  glass: 'balanced',
  backdrop: 'aurora',
}

export const NAME_MAX = 24

export const PRESETS: { id: string; label: string; primary: string; secondary: string; nameColor: string }[] = [
  { id: 'coral', label: 'Marjon', primary: '#D94B59', secondary: '#172B3A', nameColor: '#F9B928' },
  { id: 'emerald', label: 'Zumrad', primary: '#0F7B5F', secondary: '#12302A', nameColor: '#0F7B5F' },
  { id: 'indigo', label: 'Indigo', primary: '#4F46C8', secondary: '#1B1B3A', nameColor: '#1B1B3A' },
  { id: 'mono', label: 'Monoxrom', primary: '#1D1D1F', secondary: '#3A3A3E', nameColor: '#1D1D1F' },
]
