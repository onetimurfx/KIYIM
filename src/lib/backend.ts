/**
 * The app talks to this object only. In the demo it is the in-browser backend (src/demo): no network, no accounts.
 */
export { BackendError, type ErrorKind, type CartItem, type PlaceOrderRequest, type PickupPlaceRequest, type AdminParams } from './backendTypes'
import { createDemoBackend } from '../demo/backend'
import { IMG_PREFIX } from '../demo/db'

export type Backend = ReturnType<typeof createDemoBackend>
export const backend: Backend = createDemoBackend()

/** Photos the demo admin uploaded ('demo-img:<id>') are kept in localStorage; everything else has no photo (illustrations are drawn). */
export function imageUrl(path: string): string | null {
  if (!path || !path.startsWith('demo-img:')) return null
  try {
    return window.localStorage.getItem(IMG_PREFIX.slice(0, -'demo-img:'.length) + path)
  } catch {
    return null
  }
}
