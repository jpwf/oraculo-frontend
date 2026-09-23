import Header from '../components/header'
import RiskMap from '../components/RiskMap'
import '../App.css'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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



function TelemetryPage() {
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
  const [mapCoordinates, setCoordinates] = useState([-41.83, -9.45])

  const isHighCurtailment = curtailmentValue > 60
  const isHighEnergyRisk = energyRiskValue > 200

  const causeRows = [
    { label: 'Transmission', value: 58, color: '#ff5a5a' },
    { label: 'Electrical', value: 24, color: '#4ecae6' },
    { label: 'Energy', value: 12, color: '#f5b94b' },
    { label: 'Other', value: 6, color: '#a7b0bf' },
  ]

  const riskEvolutionSeries = [5, 18, 28, 45, 62, 78, 82, 64, 42, 22, 10, 6]
  const riskEvolutionPeak = { time: '14:15', value: 82 }

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

          <Link to="/" className="route-link-button">
            Home
          </Link>
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
            <p>{energyRiskMwh} MWh (Energy Spill)</p>
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
          <RiskMap
            coordinates={mapCoordinates}
            points={[
              { label: 'High Risk', value: `${curtailmentValue}%`, color: '#ef4444' },
              { label: 'Medium Risk', value: `${p50}%`, color: '#f59e0b' },
              { label: 'Low Risk', value: `${p10}%`, color: '#38bdf8' },
            ]}
            resources={[
              { type: 'WIND', name: 'Wind Farm 1', coordinates: [-40.1, -11.5], color: '#38bdf8' },
              { type: 'WIND', name: 'Wind Farm 2', coordinates: [-39.2, -9.8], color: '#38bdf8' },
              { type: 'SOLAR_PLANT', name: 'Solar Plant 1', coordinates: [-38.5, -3.7], color: '#f59e0b' },
              { type: 'SOLAR_PLANT', name: 'Solar Plant 2', coordinates: [-41.1, -7.4], color: '#f59e0b' },
              { type: 'MMGD', name: 'MMGD 1', coordinates: [-42.5, -12.8], color: '#34d399' },
              { type: 'BESS', name: 'BESS 1', coordinates: [-39.8, -8.9], color: '#a78bfa' },
            ]}
          />
        </div>

        <div className="risk-deep-data">
          <div className="risk-deep-data-header">
            <h2>RISK DETAILS</h2>
            <span className="risk-deep-region">{regiao} ({uf})</span>
          </div>

          <div className="risk-detail-list">
            <div className="risk-detail-row">
              <span className="risk-detail-label">Curtailment Probability</span>
              <strong className="risk-detail-value danger">{curtailmentValue}%</strong>
            </div>
            <div className="risk-detail-row">
              <span className="risk-detail-label">Expected Volume</span>
              <strong className="risk-detail-value">320 MW</strong>
            </div>
            <div className="risk-detail-row">
              <span className="risk-detail-label">Critical Window</span>
              <strong className="risk-detail-value">{criticalWindow}</strong>
            </div>
            <div className="risk-detail-row">
              <span className="risk-detail-label">Most Exposed Region</span>
              <strong className="risk-detail-value danger">{uf} {regiao}</strong>
            </div>
            <div className="risk-detail-row">
              <span className="risk-detail-label">Probable Cause</span>
              <strong className="risk-detail-value highlight">Transmission Limit</strong>
            </div>
            <div className="risk-detail-row">
              <span className="risk-detail-label">Affected Assets</span>
              <strong className="risk-detail-value">12 Farms</strong>
            </div>
          </div>

          <div className="risk-evolution-card">
            <div className="risk-evolution-header">
              <h3>RISK EVOLUTION (PROBABILITY)</h3>
              <span className="risk-peak-tag">Peak: {riskEvolutionPeak.time} ({riskEvolutionPeak.value}%)</span>
            </div>

            <div className="risk-chart-wrap">
              <svg viewBox="0 0 500 220" role="img" aria-label="Risk evolution chart" className="risk-chart-svg">
                {[0, 25, 50, 75, 100].map((tick) => {
                  const y = 18 + (100 - tick) * 1.7
                  return (
                    <g key={tick}>
                      <line x1="18" y1={y} x2="474" y2={y} stroke="rgba(255,255,255,0.12)" strokeDasharray="3 5" />
                      <text x="0" y={y + 4} fill="rgba(219,225,235,0.7)" fontSize="10">{tick}%</text>
                    </g>
                  )
                })}

                <path
                  d={`M 18 204 ${riskEvolutionSeries
                    .map((value, index) => {
                      const x = 18 + index * 38.5
                      const y = 190 - value * 1.2
                      return `L ${x} ${y}`
                    })
                    .join(' ')} L 474 204 Z`}
                  fill="rgba(255, 106, 78, 0.15)"
                />

                <path
                  d={riskEvolutionSeries
                    .map((value, index) => {
                      const x = 18 + index * 38.5
                      const y = 190 - value * 1.2
                      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#ff5a5a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <line x1={18 + 6 * 38.5} y1="20" x2={18 + 6 * 38.5} y2="190" stroke="rgba(255,255,255,0.18)" strokeDasharray="4 4" />

                {riskEvolutionSeries.map((value, index) => {
                  const x = 18 + index * 38.5
                  const y = 190 - value * 1.2
                  return index === 6 ? (
                    <circle key={`${value}-${index}`} cx={x} cy={y} r="4.5" fill="#ff5a5a" stroke="#ffd3cf" strokeWidth="2" />
                  ) : null
                })}

                {[0, 1, 2, 3, 4, 5].map((index) => {
                  const x = 18 + index * 90
                  const label = ['00h', '06h', '12h', '18h', '24h'][index]
                  return label ? (
                    <text key={label} x={x} y="212" fill="rgba(219,225,235,0.7)" fontSize="11" textAnchor="middle">
                      {label}
                    </text>
                  ) : null
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="renew-scenarios panel-block">
        <div className="panel-header">
          <h3>Renewable Generation Scenarios (MW)</h3>
          <div className="panel-header-tools">
            <div className="inline-legend">
              <span className="legend-swatch p90" /> P90
              <span className="legend-swatch p50" /> P50
              <span className="legend-swatch p10" /> P10
            </div>
          </div>
        </div>

        <div className="scenario-layout">
          <div className="scenario-cards">
            <div className="scenario-card selected">
              <span className="scenario-label">Best Case (P50)</span>
              <div className="scenario-value-row">
                <strong>2,400</strong>
                <span>MW</span>
              </div>
              <small>Curtailment: 210 MW</small>
            </div>

            <div className="scenario-card worst-case">
              <span className="scenario-label">Worst Case (P10)</span>
              <div className="scenario-value-row">
                <strong>1,900</strong>
                <span>MW</span>
              </div>
              <small>Curtailment: 380 MW</small>
            </div>

            <div className="scenario-card best-case">
              <span className="scenario-label">Best Case (P90)</span>
              <div className="scenario-value-row">
                <strong>2,800</strong>
                <span>MW</span>
              </div>
              <small>Curtailment: 80 MW</small>
            </div>

            <div className="scenario-card">
              <span className="scenario-label">Scenario</span>
              <select defaultValue="scenario-1">
                <option value="scenario-1">Select scenario</option>
                <option value="scenario-2">Low curtailment</option>
                <option value="scenario-3">Base case</option>
                <option value="scenario-4">High stress</option>
              </select>
            </div>
          </div>

          <div className="scenario-chart-panel">
            <div className="chart-topline">
              <span>Generation Scenarios — N possible trajectories</span>
              <div className="chart-line-labels">
                <span style={{ color: '#f5b94b' }}>P90</span>
                <span style={{ color: '#3dd9ff' }}>P50</span>
                <span style={{ color: '#f97316' }}>P10</span>
              </div>
            </div>

            <svg viewBox="0 0 640 240" className="scenario-svg" role="img" aria-label="Renewable generation scenarios chart">
              {[0, 1, 2, 3, 4].map((tick) => {
                const y = 20 + tick * 46
                return <line key={tick} x1="28" y1={y} x2="610" y2={y} stroke="rgba(148,163,184,0.18)" strokeDasharray="4 8" />
              })}

              <path d="M 30 170 C 100 150, 150 128, 210 118 S 330 100, 390 92 S 500 75, 610 60" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 30 190 C 90 180, 120 160, 180 142 S 300 114, 390 104 S 510 92, 610 88" fill="none" stroke="#3dd9ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 30 205 C 100 198, 170 186, 250 170 S 380 130, 440 120 S 540 106, 610 92" fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

              {[0, 1, 2, 3, 4, 5].map((tick) => {
                const x = 30 + tick * 116
                const labels = ['00:00', '06:00', '12:00', '18:00', '24:00', '30:00']
                return (
                  <text key={tick} x={x} y="224" fill="rgba(219,225,235,0.7)" fontSize="10" textAnchor="middle">
                    {labels[tick]}
                  </text>
                )
              })}
            </svg>
          </div>
        </div>
      </div>

      <div className="vpp-sources panel-block">
        <div className="vpp-header-row">
          <h3>VPP Resources <span>(Available for Curtailment Mitigation &amp; Dispatch)</span></h3>
          <div className="aggregate-select">
            <span>Aggregate by:</span>
            <select defaultValue="Region">
              <option>Region</option>
              <option>Asset</option>
              <option>Technology</option>
            </select>
          </div>
        </div>

        <div className="vpp-main-layout">
          <div className="vpp-cards">
            <div className="vpp-card">
              <div className="vpp-card-head">
                <span className="resource-icon green">⚡</span>
                BESS
              </div>
              <div className="vpp-value">180 <small>MW</small></div>
              <div className="vpp-subvalue">428 MWh</div>
              <div className="vpp-foot">
                <span>Availability: 96%</span>
                <span>Assets: 8</span>
                <button type="button">View details</button>
              </div>
            </div>

            <div className="vpp-card">
              <div className="vpp-card-head">
                <span className="resource-icon blue">◫</span>
                MMGD
              </div>
              <div className="vpp-value">120 <small>MW</small></div>
              <div className="vpp-subvalue">Solar DG</div>
              <div className="vpp-foot">
                <span>Availability: 91%</span>
                <span>Assets: 56</span>
                <button type="button">View details</button>
              </div>
            </div>

            <div className="vpp-card">
              <div className="vpp-card-head">
                <span className="resource-icon amber">▣</span>
                Distributed Gen
              </div>
              <div className="vpp-value">68 <small>MW</small></div>
              <div className="vpp-subvalue">60 MW / Hydro</div>
              <div className="vpp-foot">
                <span>Availability: 94%</span>
                <span>Assets: 66</span>
                <button type="button">View details</button>
              </div>
            </div>

            <div className="vpp-card">
              <div className="vpp-card-head">
                <span className="resource-icon cyan">◇</span>
                Flexible Loads
              </div>
              <div className="vpp-value">75 <small>MW</small></div>
              <div className="vpp-subvalue">Industrial DR</div>
              <div className="vpp-foot">
                <span>Availability: 88%</span>
                <span>Assets: 10</span>
                <button type="button">View details</button>
              </div>
            </div>

            <div className="vpp-card">
              <div className="vpp-card-head">
                <span className="resource-icon violet">◎</span>
                Other Resources
              </div>
              <div className="vpp-value">40 <small>MW</small></div>
              <div className="vpp-subvalue">Demand response</div>
              <div className="vpp-foot">
                <span>Availability: 90%</span>
                <span>Assets: 19</span>
                <button type="button">View details</button>
              </div>
            </div>
          </div>

          <aside className="mitigation-panel">
            <div className="mitigation-header">
              <span className="mitigation-badge">✓</span>
              Recommened ISO dispatch action
            </div>

            <h4>Activate 180 MW of BESS between 13:30 and 16:45</h4>

            <div className="mitigation-metrics">
              <div><span>Curtailment without action:</span><strong>320 MW</strong></div>
              <div><span>Curtailment after action:</span><strong>75 MW</strong></div>
              <div><span>Energy potentially recovered:</span><strong>225 MWh</strong></div>
              <div><span>Mitigation coverage:</span><strong>82%</strong></div>
            </div>

            <button type="button" className="simulate-button">Simulate mitigation →</button>
          </aside>
        </div>
      </div>
    </>
  )
}

export default TelemetryPage
