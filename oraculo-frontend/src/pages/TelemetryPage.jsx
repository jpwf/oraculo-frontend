import Header from '../components/header'
import RiskMap from '../components/RiskMap'
import '../App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, Zap, MapPin, TriangleAlert } from 'lucide-react'
import * as echarts from 'echarts'
import { fetchFirstAvailable } from '../services/api'
import { normalizeTelemetryPayload } from '../utils/normalizeTelemetry'
import { useNormalizedTelemetry } from '../hooks/useNormalizedTelemetry'
import { useTelemetryStream } from '../hooks/useTelemetryStream'
import Skeleton from '../components/Skeleton'

const directionOptions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

const TELEMETRY_ENDPOINTS = ['/data-telemetry', 'data-telemetry', '/api/telemetry']
const TELEMETRY_STREAM_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/stream/telemetry`

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
  // Estado consolidado: UM objeto normalizado (antes eram ~16 useState de dados).
  const [data, setData] = useState(() => normalizeTelemetryPayload({}))
  // Inputs do usuario ficam separados: a selecao de submercado NAO deve ser
  // sobrescrita pelo polling a cada 10s.
  const [uf, setUf] = useState(data.uf)
  const [regiao, setRegiao] = useState(data.regiao)
  const [isRefreshing, setIsRefreshing] = useState(false)
  // Loading das requisicoes: true ate o 1o payload (stream/fetch) chegar ou falhar.
  const [isLoading, setIsLoading] = useState(true)

  // Campos derivados do dado normalizado.
  const horizonte = data.horizonte
  const curtailmentValue = data.curtailmentValue
  const p10 = data.p10
  const p50 = data.p50
  const p90 = data.p90
  const energyRiskValue = data.energyRiskValue
  const energyRiskMwh = data.energyRiskMwh
  const criticalWindow = data.criticalWindow
  const mapCoordinates = data.mapCoordinates
  const criticalPoint = data.criticalPoint
  const riskPoints = data.riskPoints
  const mapResources = data.resources
  const causeRows = data.causeRows
  const riskEvolutionSeries = data.riskEvolutionSeries
  const riskEvolutionPeak = data.riskEvolutionPeak
  const transmissionLine = data.transmissionLine
  const mitigation = data.mitigation

  const curtailmentChartRef = useRef(null)
  const curtailmentChartInstanceRef = useRef(null)

  const isHighCurtailment = curtailmentValue > 60

  // Ponto 2B: normalizacao pesada roda em Web Worker (fora da main thread).
  const { normalized, normalize } = useNormalizedTelemetry()

  // Ponto 1B: fetcher usado tanto no fallback de polling quanto no refresh manual.
  // Corre os endpoints em paralelo (ponto 1A) e devolve o payload cru para o worker.
  const fetchTelemetryPayload = async (config = {}) => {
    const { data } = await fetchFirstAvailable(TELEMETRY_ENDPOINTS, { timeout: 30000, ...config })
    return data
  }

  // Ponto 1B: stream em tempo real (SSE) com fallback de polling.
  const { data: streamedPayload } = useTelemetryStream(TELEMETRY_STREAM_URL, fetchTelemetryPayload, {
    pollIntervalMs: 10000,
  })

  // Cada payload cru (stream, polling ou refresh) e enviado ao worker para normalizar.
  useEffect(() => {
    if (streamedPayload != null) normalize(streamedPayload)
  }, [streamedPayload, normalize])

  // Quando o worker devolve o objeto normalizado, aplicamos de uma vez (1 setState).
  // uf/regiao NAO sao sobrescritos: sao controlados pela selecao do usuario.
  useEffect(() => {
    if (!normalized) return
    setData(normalized)
    setIsLoading(false)
  }, [normalized])

  // Loading inicial: garante que o skeleton NUNCA fique preso.
  // O loading sempre encerra: no sucesso, na falha, e por um teto de tempo.
  // Sem backend, os campos caem nos defaults ja presentes no estado.
  useEffect(() => {
    // Teto de seguranca independente do fetch: encerra o loading de qualquer jeito.
    const safety = setTimeout(() => setIsLoading(false), 1500)

    // Nao bloqueia a UI: roda em paralelo ao stream/polling.
    fetchTelemetryPayload()
      .then((payload) => normalize(payload))
      .catch(() => {
        // sem resposta: mantem defaults
      })
      .finally(() => setIsLoading(false))

    return () => clearTimeout(safety)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Ponto 3: cria a instancia do ECharts UMA vez (mount) e so a atualiza depois.
  useEffect(() => {
    if (!curtailmentChartRef.current) return undefined

    const chart = echarts.init(curtailmentChartRef.current)
    curtailmentChartInstanceRef.current = chart

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      curtailmentChartInstanceRef.current = null
    }
  }, [])

  // Ponto 3 + memo estavel: monta a option so quando o valor relevante muda.
  const curtailmentOption = useMemo(() => {
    const primaryColor = isHighCurtailment ? '#ef4444' : '#22c55e'
    return {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'pie',
          radius: ['72%', '92%'],
          center: ['50%', '50%'],
          startAngle: 90,
          avoidLabelOverlap: false,
          silent: true,
          itemStyle: { borderWidth: 0 },
          label: { show: false },
          labelLine: { show: false },
          data: [
            { value: curtailmentValue, name: 'Curtailment', itemStyle: { color: primaryColor } },
            { value: 100 - curtailmentValue, name: 'Rest', itemStyle: { color: 'rgba(255,255,255,0.08)' } },
          ],
        },
      ],
    }
  }, [curtailmentValue, isHighCurtailment])

  // Ponto 3: atualiza o grafico existente via setOption (merge/diff), sem recriar.
  useEffect(() => {
    curtailmentChartInstanceRef.current?.setOption(curtailmentOption)
  }, [curtailmentOption])

  const handleDirectionChange = (value) => {
    setUf(value)
    setRegiao(regionMap[value] || 'North')
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Piso de tempo para o icone completar ao menos um giro visivel,
    // mesmo quando o fetch resolve/rejeita quase instantaneamente.
    const minSpin = new Promise((resolve) => setTimeout(resolve, 700))
    try {
      const payload = await fetchTelemetryPayload()
      normalize(payload)
    } catch {
      // nenhum endpoint respondeu: mantem o ultimo estado valido
    } finally {
      await minSpin
      setIsRefreshing(false)
    }
  }

  return (
    <>
      <Header
        system_status="online"
        title="ORÁCULO"
        dispatchText="VPP CORE"
        modeOptions={['VPP', 'MODELS']}
        defaultMode="VPP"
      />

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
              <h2><Skeleton loading={isLoading} width={70} height={30}>{curtailmentValue}%</Skeleton></h2>
              <p className={isHighCurtailment ? 'danger-text' : 'safe-text'}>
                {isHighCurtailment ? 'Critical risk threshold exceeded' : 'Below critical threshold'}
              </p>
            </div>
          </div>
          <div className="curtailment-metrics">
            <p>P10: <Skeleton loading={isLoading} width={28}>{p10}%</Skeleton></p>
            <p>P50: <Skeleton loading={isLoading} width={28}>{p50}%</Skeleton></p>
            <p>P90: <Skeleton loading={isLoading} width={28}>{p90}%</Skeleton></p>
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
              <h1><Skeleton loading={isLoading} width={90} height={34}>{energyRiskValue}</Skeleton></h1>
              <p>MW</p>
            </div>
            <p><Skeleton loading={isLoading} width={150}>{energyRiskMwh} MWh (Energy Spill)</Skeleton></p>
          </div>

          <div className="energy-risk-window">
            <p>Critical window:</p>
            <h3><Skeleton loading={isLoading} width={110}>{criticalWindow}</Skeleton></h3>
          </div>
        </div>

        <div className="highest-risk">
          <div className="highest-risk-header">
            <div className="energy-risk-title-wrap">
              <h3>HIGHEST-RISK NODE</h3>
              <span className="highest-risk-icon-box" aria-label="highest risk icon">
                <MapPin className="highest-risk-icon" size={16} strokeWidth={2.5} />
              </span>
            </div>
          </div>

          <div className="highest-risk-value">
            <div className="highest-risk-node">
              <h1><Skeleton loading={isLoading} width={120} height={30}>{regiao}({uf})</Skeleton></h1>
            </div>
            <p className="location"><Skeleton loading={isLoading} width={170}>{transmissionLine}</Skeleton></p>
          </div>

          <div className="energy-risk-window impacted-assets">
            <p>Impacted Assets:</p>
            <h3><Skeleton loading={isLoading} width={90}>{criticalPoint.affectedAssets} Farms</Skeleton></h3>
          </div>
        </div>

        <div className="cause">
          <div className="cause-header">
            <h3>PROBABLE CAUSE</h3>
            <span className="cause-icon-box" aria-label="probable cause icon">
              <TriangleAlert className="cause-icon" size={16} strokeWidth={2.5} />
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
            points={riskPoints.map((point) => ({
              ...point,
              value: String(point.value).endsWith('%') ? point.value : `${point.value}%`,
            }))}
            resources={mapResources}
            criticalPoint={criticalPoint}
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
              <strong className="risk-detail-value danger"><Skeleton loading={isLoading} width={40}>{curtailmentValue}%</Skeleton></strong>
            </div>
            <div className="risk-detail-row">
              <span className="risk-detail-label">Expected Volume</span>
              <strong className="risk-detail-value"><Skeleton loading={isLoading} width={60}>{criticalPoint.volumeAtRisk} MW</Skeleton></strong>
            </div>
            <div className="risk-detail-row">
              <span className="risk-detail-label">Critical Window</span>
              <strong className="risk-detail-value"><Skeleton loading={isLoading} width={90}>{criticalWindow}</Skeleton></strong>
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
              <strong className="risk-detail-value"><Skeleton loading={isLoading} width={70}>{criticalPoint.affectedAssets} Farms</Skeleton></strong>
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
              Recommended ISO dispatch action
            </div>

            <h4><Skeleton loading={isLoading} width={260}>{mitigation.action}</Skeleton></h4>

            <div className="mitigation-metrics">
              <div className="mitigation-row">
                <span className="mitigation-label">Curtailment without action:</span>
                <strong className="mitigation-value danger">
                  <Skeleton loading={isLoading} width={60}>{mitigation.curtailmentWithout} <small>MWh</small></Skeleton>
                </strong>
              </div>
              <div className="mitigation-row">
                <span className="mitigation-label">Curtailment after action:</span>
                <strong className="mitigation-value success">
                  <Skeleton loading={isLoading} width={60}>{mitigation.curtailmentAfter} <small>MWh</small></Skeleton>
                </strong>
              </div>
              <div className="mitigation-row">
                <span className="mitigation-label">Energy potentially recovered:</span>
                <strong className="mitigation-value">
                  <Skeleton loading={isLoading} width={60}>{mitigation.energyRecovered} <small>MWh</small></Skeleton>
                </strong>
              </div>
              <div className="mitigation-row">
                <span className="mitigation-label">Mitigation coverage:</span>
                <strong className="mitigation-value warning">
                  <Skeleton loading={isLoading} width={40}>{mitigation.coverage}<small>%</small></Skeleton>
                </strong>
              </div>
              <div className="mitigation-row mitigation-row-divider">
                <span className="mitigation-label">Resources required:</span>
                <strong className="mitigation-value strong">
                  <Skeleton loading={isLoading} width={220}>{mitigation.resourcesRequired}</Skeleton>
                </strong>
              </div>
            </div>

            <button type="button" className="simulate-button">Simulate mitigation →</button>
          </aside>
        </div>
      </div>
    </>
  )
}

export default TelemetryPage
