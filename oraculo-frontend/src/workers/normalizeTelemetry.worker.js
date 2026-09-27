import { normalizeTelemetryPayload } from '../utils/normalizeTelemetry'

self.onmessage = (event) => {
  const { id, payload } = event.data || {}
  try {
    const normalized = normalizeTelemetryPayload(payload)
    self.postMessage({ id, ok: true, normalized })
  } catch (error) {
    self.postMessage({ id, ok: false, error: String(error?.message || error) })
  }
}
