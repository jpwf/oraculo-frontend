import { useEffect, useState } from 'react'
import './components.css'

const formatUtcDate = (date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
  )

  return `${values.month} ${values.day}, ${values.year} ${values.hour}:${values.minute}:${values.second} UTC`
}

const getStatusMeta = (systemStatus) => {
  const status = String(systemStatus || '').toLowerCase()

  if (status === 'offline' || status === 'error') {
    return { label: 'Offline', className: 'status-offline' }
  }

  if (status === 'warning' || status === 'degraded') {
    return { label: 'Warning', className: 'status-warning' }
  }

  return { label: 'Online', className: 'status-online' }
}

function Header({ system_status = 'online', initialLatency = 18 }) {
  const [selectedMode, setSelectedMode] = useState('VPP')
  const [latencyMs, setLatencyMs] = useState(initialLatency)
  const [utcTime, setUtcTime] = useState(() => formatUtcDate(new Date()))

  useEffect(() => {
    const timer = setInterval(() => {
      setUtcTime(formatUtcDate(new Date()))
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const statusMeta = getStatusMeta(system_status)

  return (
    <header className="header">
      <div className="left-side">
        <p>logo</p>
        <h2>ORÁCULO</h2>
        <div className="dispatch-copy">
          <h3>ISO DISPATCH V4.18</h3>
        </div>

        <div className="type-switch" aria-label="Display mode switch">
          <button
            type="button"
            className={`switch-button ${selectedMode === 'VPP' ? 'selected' : ''}`}
            onClick={() => setSelectedMode('VPP')}
          >
            VPP
          </button>
          <button
            type="button"
            className={`switch-button ${selectedMode === 'MODELS' ? 'selected' : ''}`}
            onClick={() => setSelectedMode('MODELS')}
          >
            MODELS
          </button>
        </div>
      </div>

      <div className="right-side">
        <div className="status-block">
          <span className={`bullet-status ${statusMeta.className}`}></span>
          <span className={`text-status ${statusMeta.className}`}>System {statusMeta.label}</span>
        </div>

        <div className="latency-block">
          <span className="bullet-status secondary-bullet"></span>
          <p className="latency-value">{latencyMs} ms</p>
          <span className="latency-label">LATENCY</span>
        </div>

        <div className="utc-block">
          <span className="utc-value">{utcTime}</span>
        </div>
      </div>
    </header>
  )
}

export default Header