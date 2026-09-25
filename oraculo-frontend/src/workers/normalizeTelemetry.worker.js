// Ponto 2B: normalizacao do payload de telemetria fora da main thread.
// Recebe o payload cru via postMessage e devolve o objeto ja normalizado.
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
