/** Brand identity of one shop (tenant). Plain JSON: it can come from localStorage today and from a tenant API later. */
export type GlassLevel = 'clear' | 'balanced' | 'solid'
export type Backdrop = 'aurora' | 'plain'

export interface BrandLogo {
  /** base64 data URL (png, webp or svg) */
  src: string
  width: number
  height: number
}

export interface BrandConfig {
  v: 1
  name: string
  logo: BrandLogo | null
  /** show the name next to the logo (without a logo the name is always shown) */
  showName: boolean
  /** main accent: buttons, badges, active states */
  primary: string
  /** second colour: dark buttons, selected chips, backdrop tint */
  secondary: string
  /** colour of the text wordmark */
  nameColor: string
  glass: GlassLevel
  backdrop: Backdrop
}
