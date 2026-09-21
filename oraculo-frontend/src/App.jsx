import Header from './components/header'
import './App.css'
import { useEffect, useRef, useState } from 'react'
import { RefreshCw, Zap } from 'lucide-react'
import * as echarts from 'echarts'

const directionOptions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

const regionMap = {
  N: 'North',
  NE: 'Northeast',
  E: 'East',
  SE: 'Southeast',
  S: 'South',
  SW: 'Southwest',
  W: 'West',
  NW: 'Northwest',
}

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

function App() {
  const [regiao, setRegiao] = useState('Northeast')
  const [uf, setUf] = useState('NE')
  const [horizonte, setHorizonte] = useState('D0 + D1')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [curtailmentValue, setCurtailmentValue] = useState(72)
  const [p10, setP10] = useState(40)
  const [p50, setP50] = useState(58)
  const [p90, setP90] = useState(81)
  const [energyRiskValue, setEnergyRiskValue] = useState(216)
  const [energyRiskMwh, setEnergyRiskMwh] = useState(154)
  const [criticalWindow, setCriticalWindow] = useState('12:00 - 18:00')
  const curtailmentChartRef = useRef(null)

  const isHighCurtailment = curtailmentValue > 60
  const isHighEnergyRisk = energyRiskValue > 200

  const causeRows = [
    { label: 'Transmission', value: 58, color: '#ff5a5a' },
    { label: 'Electrical', value: 24, color: '#4ecae6' },
    { label: 'Energy', value: 12, color: '#f5b94b' },
    { label: 'Other', value: 6, color: '#a7b0bf' },
  ]

  useEffect(() => {
    if (!curtailmentChartRef.current) return

    const chart = echarts.init(curtailmentChartRef.current)
    const primaryColor = isHighCurtailment ? '#ef4444' : '#22c55e'

    chart.setOption({
      backgroundColor: 'transparent',
      series: [
        {
          type: 'pie',
          radius: ['72%', '92%'],
          center: ['50%', '50%'],
          startAngle: 90,
          avoidLabelOverlap: false,
          silent: true,
          itemStyle: {
            borderWidth: 0,
          },
          label: {
            show: false,
          },
          labelLine: {
            show: false,
          },
          data: [
            { value: curtailmentValue, name: 'Curtailment', itemStyle: { color: primaryColor } },
            { value: 100 - curtailmentValue, name: 'Rest', itemStyle: { color: 'rgba(255,255,255,0.08)' } },
          ],
        },
      ],
    })

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [curtailmentValue, isHighCurtailment])

  const handleDirectionChange = (value) => {
    setUf(value)
    setRegiao(regionMap[value] || 'North')
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    window.setTimeout(() => setIsRefreshing(false), 700)
  }

  return (
    <>
      <Header system_status="online" />

      <div className="system-infos">
        <div className="left-sub-header">
          <h3 className="region">Region: {regiao}({uf})</h3>

          <label className="field uf-field">
            <span>Submarket:</span>
            <select className="uf" value={uf} onChange={(event) => handleDirectionChange(event.target.value)}>
              {directionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <h3 className="horizon">Horizon: {horizonte} </h3>
        </div>

        <div className="right-sub-header">
          <div className="last-model-update">
            <span>Last model update:</span>
            <strong>{formatUtcDate(new Date())}</strong>
          </div>

          <div className="refresh">
            <button type="button" className="refresh-button" onClick={handleRefresh}>
              <RefreshCw className={isRefreshing ? 'refresh-icon spinning' : 'refresh-icon'} />
              Refresh Telemetry
            </button>
          </div>
        </div>
      </div>
      <div className="prediction-info">
        <div className="curtailment">
              <div className="curtailment-header">
                <div className="curtailment-title-wrap">
                  <h3>Curtailment Probability</h3>
                  <span className={`status-dot ${isHighCurtailment ? 'danger' : 'safe'}`}></span>
                </div>
              </div>
              <div className="curtailment-data">
                <div ref={curtailmentChartRef} className="donut-chart" />
                <div className="curtailment-values">
                  <h2>{curtailmentValue}%</h2>
                  <p className={isHighCurtailment ? 'danger-text' : 'safe-text'}>
                    {isHighCurtailment ? 'Critical risk threshold exceeded' : 'Below critical threshold'}
                  </p>
                </div>
              </div>
              <div className="curtailment-metrics">
                  <p>P10: {p10}%</p>
                  <p>P50: {p50}%</p>
                  <p>P90: {p90}%</p>
                </div>
        </div>
        <div className="energy-risk">
          <div className="energy-risk-header">
            <div className="energy-risk-title-wrap">
              <h3>ENERGY AT RISK</h3>
              <span className="energy-icon-box" aria-label="energy risk icon">
                <Zap className="energy-icon" size={16} strokeWidth={2.5} />
              </span>
            </div>
          </div>

          <div className="energy-risk-value">
            <div className="watts-values">
              <h1>{energyRiskValue}</h1>
              <p>MW</p>
            </div>
            <p>
              {energyRiskMwh} MWh (Energy Spill)
            </p>
          </div>

          <div className="energy-risk-window">
            <p>Critical window:</p>
            <h3>{criticalWindow}</h3>
          </div>
        </div>
        <div className="highest-risk">
          <div className="highest-risk-header">
            <div className="energy-risk-title-wrap">
              <h3>HIGHEST-RISK NODE</h3>
              <span className="highest-risk-icon-box" aria-label="highest risk icon">
                <Zap className="highest-risk-icon" size={16} strokeWidth={2.5} />
              </span>
            </div>
          </div>

          <div className="highest-risk-value">
            <div className="highest-risk-node">
              <h1>{regiao}({uf})</h1>
            </div>
            <p className="location">Sobradinho → Juazeiro 500kV</p>
          </div>

          <div className="energy-risk-window impacted-assets">
            <p>Impacted Assets:</p>
            <h3>12 Farms (8 Wind, 4 Solar)</h3>
          </div>
        </div>
        <div className="cause">
          <div className="cause-header">
            <h3>PROBABLE CAUSE</h3>
            <span className="cause-icon-box" aria-label="probable cause icon">
              <Zap className="cause-icon" size={16} strokeWidth={2.5} />
            </span>
          </div>

          <h2 className="cause-title">Transmission Limit Dominant</h2>

          <div className="cause-list">
            {causeRows.map(({ label, value, color }) => (
              <div key={label} className="cause-row">
                <span className="cause-label">{label}</span>
                <div className="cause-bar-track">
                  <span className="cause-bar" style={{ width: `${value}%`, background: color }} />
                </div>
                <span className="cause-value">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="risks-details">
        <div className="risk-map">
          <div className="risk-map-header"></div>
          <span>Mapa</span>
        </div>
        <div className="risk-deep-data">
          <div className="risk-deep-data-header">
            <h2>RISK DETAILS</h2>
            <p>{regiao} ({uf})</p>
          </div>

        </div>
      </div>

    </>
  )
}

export default App
