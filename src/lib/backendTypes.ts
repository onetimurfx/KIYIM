/** Shared types of the demo backend (same shapes the UI always used). */
/** What went wrong, in terms the UI can explain (see i18n err.*). */
export type ErrorKind = 'offline' | 'timeout' | 'server' | 'auth' | 'not_in_telegram' | 'rate_limit' | 'invalid' | 'conflict' | 'format' | 'misconfigured' | 'unavailable'

export class BackendError extends Error {
  constructor(
    public kind: ErrorKind,
    public code: string,
    public detail: Record<string, unknown> = {},
    public status?: number,
  ) {
    super(`${kind}:${code}`)
  }
}

export interface CartItem {
  productId: string
  size: string
  color: string
  qty: number
}

export interface PlaceOrderRequest {
  idempotencyKey: string
  /** the Cart only: Quick Order is store pickup now (see pickupPlace) */
  source: 'cart'
  contact: { name: string; phone: string; address: string; comment: string }
  items: CartItem[]
}

/** Quick Order = store pickup. No address, no delivery: name + phone (required) and an optional comment. */
export interface PickupPlaceRequest {
  idempotencyKey: string
  contact: { name: string; phone: string; comment: string }
  items: CartItem[]
}

export type AdminParams = Record<string, string | number | boolean | null | undefined>
