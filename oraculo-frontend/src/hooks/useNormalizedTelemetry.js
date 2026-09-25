import { useCallback, useEffect, useRef, useState } from 'react'
import { normalizeTelemetryPayload } from '../utils/normalizeTelemetry'

// Ponto 2B: hook que normaliza o payload de telemetria dentro de um Web Worker,
// tirando o parse pesado da main thread. Se o Worker nao estiver disponivel
// (ambiente sem suporte), cai para normalizacao sincrona sem quebrar a UI.
export function useNormalizedTelemetry() {
  const [normalized, setNormalized] = useState(null)
  const workerRef = useRef(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return undefined
    }

    let worker
    try {
      worker = new Worker(new URL('../workers/normalizeTelemetry.worker.js', import.meta.url), {
        type: 'module',
      })
    } catch {
      // Sem suporte a Worker: o fallback sincrono no normalize() cobre.
      return undefined
    }

    worker.onmessage = (event) => {
      const { ok, normalized: result } = event.data || {}
      if (ok && result) {
        setNormalized(result)
      }
    }

    workerRef.current = worker

    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const normalize = useCallback((payload) => {
    const worker = workerRef.current
    if (worker) {
      requestIdRef.current += 1
      worker.postMessage({ id: requestIdRef.current, payload })
      return
    }

    // Fallback: sem worker, normaliza na main thread.
    setNormalized(normalizeTelemetryPayload(payload))
  }, [])

  return { normalized, normalize }
}
