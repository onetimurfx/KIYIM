/** Spots weak phones, so the glass can use a cheaper blur there. Runs once, before the first paint. */
export interface DeviceHints {
  userAgent: string
  /** GB, rounded by the browser; Chromium only */
  deviceMemory?: number
  hardwareConcurrency?: number
}

/**
 * Telegram for Android adds the performance class to the user agent:
 * "Telegram-Android/{version} ({device}; Android {v}; SDK {n}; LOW|AVERAGE|HIGH)".
 * Elsewhere only clear signs of a small device count; when unsure, the full effect stays.
 */
export function isLowPowerDevice({ userAgent, deviceMemory, hardwareConcurrency }: DeviceHints): boolean {
  const telegram = /Telegram-Android\/[^(]*\([^)]*;\s*(LOW|AVERAGE|HIGH)\)/i.exec(userAgent)?.[1]?.toUpperCase()
  if (telegram === 'LOW') return true
  if (telegram === 'HIGH') return false
  if (deviceMemory === undefined) return false
  return deviceMemory <= 2 || (deviceMemory <= 4 && (hardwareConcurrency ?? 8) <= 4)
}

export function applyPerformanceClass(hints: DeviceHints = navigator, doc: Document = document) {
  if (isLowPowerDevice(hints)) doc.documentElement.dataset.perf = 'lite'
}
