import { useEffect, useRef, useState } from 'react'

// Ponto 1B: atualizacao continua em tempo real.
// Estrategia primaria: SSE (EventSource) -> o backend empurra telemetria.
// Fallback: polling em intervalo quando o stream nao conecta ou nao existe.
//
// Parametros:
//   streamUrl   - URL do endpoint text/event-stream (ex: `${VITE_API_URL}/stream/telemetry`)
//   pollFetcher - funcao async () => payload, usada no fallback de polling
//   options     - { enabled, pollIntervalMs }
export function useTelemetryStream(streamUrl, pollFetcher, options = {}) {
  const { enabled = true, pollIntervalMs = 10000 } = options

  const [data, setData] = useState(null)
  const [connected, setConnected] = useState(false)
  const [transport, setTransport] = useState('idle') // 'sse' | 'polling' | 'idle'

  const pollTimerRef = useRef(null)
  const pollFetcherRef = useRef(pollFetcher)
  pollFetcherRef.current = pollFetcher

  useEffect(() => {
    if (!enabled) return undefined

    let disposed = false
    let eventSource = null

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current)
        pollTimerRef.current = null
      }
    }

    const startPolling = () => {
      if (disposed || pollTimerRef.current || typeof pollFetcherRef.current !== 'function') return

      setTransport('polling')

      const tick = async () => {
        try {
          const payload = await pollFetcherRef.current()
          if (!disposed && payload != null) setData(payload)
        } catch {
          // silencioso: mantem o ultimo estado valido
        }
      }

      tick()
      pollTimerRef.current = setInterval(tick, pollIntervalMs)
    }

    const startSse = () => {
      if (!streamUrl || typeof EventSource === 'undefined') {
        startPolling()
        return
      }

      try {
        eventSource = new EventSource(streamUrl)
      } catch {
        startPolling()
        return
      }

      eventSource.onopen = () => {
        if (disposed) return
        setConnected(true)
        setTransport('sse')
        stopPolling() // se estava em polling, para: o stream assumiu
      }

      eventSource.onmessage = (event) => {
        if (disposed) return
        try {
          setData(JSON.parse(event.data))
        } catch {
          // frame invalido: ignora
        }
      }

      eventSource.onerror = () => {
        if (disposed) return
        setConnected(false)
        // Enquanto o browser tenta reconectar o SSE, garante dados via polling.
        startPolling()
      }
    }

    startSse()

    return () => {
      disposed = true
      stopPolling()
      if (eventSource) eventSource.close()
      setConnected(false)
      setTransport('idle')
    }
  }, [streamUrl, enabled, pollIntervalMs])

  return { data, connected, transport }
}
