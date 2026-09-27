import Header from '../components/header'
import RiskMap from '../components/RiskMap'
import StoragePanel from '../components/StoragePanel'
import '../App.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw, Zap, ArrowDownToLine, LayoutGrid } from 'lucide-react'
import * as echarts from 'echarts'
import { fetchFirstAvailable } from '../services/api'
import { normalizeTelemetryPayload, applyStateData } from '../utils/normalizeTelemetry'
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
  // Modo do mapa: 'mmgd' (Geracao MMGD) ou 'curtailment' (Risco de Curtailment).
  const [mapMode, setMapMode] = useState('curtailment')
  // Estado (UF) selecionado ao clicar num ativo no mapa MMGD. null = agregado.
  const [selectedState, setSelectedState] = useState(null)

  // Aplica os dados do estado selecionado por cima do dado normalizado.
  // Ativos no mesmo estado compartilham os mesmos dados (mesmo UF -> mesmos valores).
  const view = useMemo(
    () => (selectedState ? applyStateData(data, selectedState, data.assetsByState) : data),
    [data, selectedState]
  )

  // Campos derivados do dado (com override do estado selecionado, se houver).
  const kpis = view.kpis
  const storage = view.storage
  const horizonte = view.horizonte
  const curtailmentValue = view.curtailmentValue
  const criticalWindow = view.criticalWindow
  const mapCoordinates = data.mapCoordinates
  const criticalPoint = data.criticalPoint
  const riskPoints = data.riskPoints
  const riskZones = data.riskZones
  const mapResources = data.resources
  const mmgdLevels = data.mmgdLevels
  const causeRows = data.causeRows
  const riskEvolutionSeries = data.riskEvolutionSeries
  const riskEvolutionPeak = data.riskEvolutionPeak

  // Regiao/UF exibidos no RISK DETAILS: do estado selecionado, senao a selecao do usuario.
  const viewRegiao = selectedState ? view.regiao : regiao
  const viewUf = selectedState ? view.uf : uf

  const curtailmentChartRef = useRef(null)
  const curtailmentChartInstanceRef = useRef(null)

  const isHighCurtailment = curtailmentValue > 60

  // Ponto 2B: normalizacao pesada roda em Web Worker (fora da main thread).
  const { normalized, normalize } = useNormalizedTelemetry()

  // Ponto 1B: fetcher usado tanto no fallback de polling quanto no refresh manual.
  // Corre os endpoints em paralelo (ponto 1A) e devolve o payload cru para o worker.
  const fetchTelemetryPayload = async (config = {}) => {
    const { data: payload } = await fetchFirstAvailable(TELEMETRY_ENDPOINTS, { timeout: 30000, ...config })
    return payload
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
    const safety = setTimeout(() => setIsLoading(false), 1500)

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
        modeOptions={['Visão Detalhada', 'Visão Executiva']}
        defaultMode="Visão Detalhada"
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

      {/* Linha 1 — KPIs do topo (foto 1, em portugues) */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-card-title">PROBABILIDADE DE CONSTRAINED OFF</span>
            <span className={`status-dot ${isHighCurtailment ? 'danger' : 'safe'}`}></span>
          </div>
          <div className="kpi-donut-row">
            <div ref={curtailmentChartRef} className="kpi-donut" />
            <h2 className="kpi-donut-value">
              <Skeleton loading={isLoading} width={60} height={26}>{curtailmentValue}%</Skeleton>
            </h2>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-card-title">VOLUME EÓLICO CONSTRAINED OFF PREVISTO</span>
            <span className="kpi-icon-box amber"><Zap size={14} strokeWidth={2.5} /></span>
          </div>
          <div className="kpi-big">
            <Skeleton loading={isLoading} width={90} height={30}>{Number(kpis.volumeEolico).toLocaleString('pt-BR')}</Skeleton>
            <span className="kpi-unit">MW</span>
          </div>
          <div className="kpi-foot">
            <span>Janela Crítica:</span>
            <strong><Skeleton loading={isLoading} width={90}>{kpis.janelaCritica}</Skeleton></strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-card-title">MINUTOS RESTRITOS POR HORA OPERATIVA</span>
            <span className="kpi-icon-box cyan"><ArrowDownToLine size={14} strokeWidth={2.5} /></span>
          </div>
          <div className="kpi-big">
            <Skeleton loading={isLoading} width={60} height={30}>{kpis.minutosRestritos}</Skeleton>
            <span className="kpi-unit">min</span>
          </div>
          <div className="kpi-foot">
            <span>Duração contínua:</span>
            <strong><Skeleton loading={isLoading} width={70}>{kpis.duracaoContinua}</Skeleton></strong>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-head">
            <span className="kpi-card-title">VOLUME MMGD TOTAL PREVISTO (T+24)</span>
            <span className="kpi-icon-box"><LayoutGrid size={14} strokeWidth={2.5} /></span>
          </div>
          <div className="kpi-big">
            <Skeleton loading={isLoading} width={110} height={30}>{Number(kpis.volumeMMGD).toLocaleString('pt-BR')}</Skeleton>
            <span className="kpi-unit">MW</span>
          </div>
        </div>
      </div>

      {/* Linha 2 — Mapa (com switch) + Painel de Armazenamento (BESS) */}
      <div className="telemetry-main-row">
        <div className="map-panel">
          <div className="map-panel-head">
            <div className="map-panel-title">
              <span className="map-title-dot" />
              MEUS ATIVOS — CONJUNTO EÓLICO CAÇAMARI
            </div>
            <div className="map-switch">
              <button
                type="button"
                className={`map-switch-btn ${mapMode === 'mmgd' ? 'active' : ''}`}
                onClick={() => { setMapMode('mmgd') }}
              >
                Geração MMGD
              </button>
              <button
                type="button"
                className={`map-switch-btn ${mapMode === 'curtailment' ? 'active' : ''}`}
                onClick={() => { setMapMode('curtailment'); setSelectedState(null) }}
              >
                Risco de Curtailment
              </button>
            </div>
          </div>
          {mapMode === 'mmgd' && selectedState && (
            <div className="map-selected-note">
              Exibindo dados de <strong>{view.regiao} ({selectedState})</strong>
              <button type="button" className="map-clear-btn" onClick={() => setSelectedState(null)}>limpar</button>
            </div>
          )}
          <div className="map-panel-body">
            <RiskMap
              mode={mapMode}
              coordinates={mapCoordinates}
              points={riskPoints.map((point) => ({
                ...point,
                value: String(point.value).endsWith('%') ? point.value : `${point.value}%`,
              }))}
              resources={mapResources}
              criticalPoint={criticalPoint}
              riskZones={riskZones}
              mmgdLevels={mmgdLevels}
              onSelectState={mapMode === 'mmgd' ? setSelectedState : null}
            />
          </div>
        </div>

        <StoragePanel storage={storage} loading={isLoading} />
      </div>

      {/* Linha 3 — RISK DETAILS + RISK EVOLUTION ao lado da Causa Provável */}
      <div className="risks-details">
        <div className="risk-deep-data">
          <div className="risk-deep-data-header">
            <h2>RISK DETAILS</h2>
            <span className="risk-deep-region">{viewRegiao} ({viewUf})</span>
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
              <strong className="risk-detail-value danger">{viewUf} {viewRegiao}</strong>
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

        <div className="cause">
          <div className="cause-header">
            <h3>CAUSA PROVÁVEL</h3>
            <span className="cause-icon-box" aria-label="ícone de causa provável">
              <Zap className="cause-icon" size={16} strokeWidth={2.5} />
            </span>
          </div>

          <h2 className="cause-title">Limite de Transmissão Dominante</h2>

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
    </>
  )
}

export default TelemetryPage
