import { useEffect, useRef, useState } from 'react'

export function useTelemetryStream(streamUrl, pollFetcher, options = {}) {
  const { enabled = true, pollIntervalMs = 10000 } = options

  const [data, setData] = useState(null)
  const [connected, setConnected] = useState(false)
  const [transport, setTransport] = useState('idle')

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
        stopPolling()
      }

      eventSource.onmessage = (event) => {
        if (disposed) return
        try {
          setData(JSON.parse(event.data))
        } catch {
        }
      }

      eventSource.onerror = () => {
        if (disposed) return
        setConnected(false)
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
