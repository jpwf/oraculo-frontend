import Header from '../components/header'
import RiskMap from '../components/RiskMap'
import StoragePanel from '../components/StoragePanel'
import SimulationOutputChart from '../components/SimulationOutputChart'
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
  const [data, setData] = useState(() => normalizeTelemetryPayload({}))
  const [uf, setUf] = useState(data.uf)
  const [regiao, setRegiao] = useState(data.regiao)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [mapMode, setMapMode] = useState('curtailment')
  const [selectedState, setSelectedState] = useState(null)

  const view = useMemo(
    () => (selectedState ? applyStateData(data, selectedState, data.assetsByState) : data),
    [data, selectedState]
  )

  const kpis = view.kpis
  const storage = view.storage
  const horizonte = view.horizonte
  const curtailmentValue = view.curtailmentValue
  const mapCoordinates = data.mapCoordinates
  const criticalPoint = data.criticalPoint
  const riskPoints = data.riskPoints
  const riskZones = data.riskZones
  const mapResources = data.resources
  const mmgdLevels = data.mmgdLevels
  const simulationOutput = data.simulationOutput

  const curtailmentChartRef = useRef(null)
  const curtailmentChartInstanceRef = useRef(null)

  const isHighCurtailment = curtailmentValue > 60

  const { normalized, normalize } = useNormalizedTelemetry()

  const fetchTelemetryPayload = async (config = {}) => {
    const { data: payload } = await fetchFirstAvailable(TELEMETRY_ENDPOINTS, { timeout: 30000, ...config })
    return payload
  }

  const { data: streamedPayload } = useTelemetryStream(TELEMETRY_STREAM_URL, fetchTelemetryPayload, {
    pollIntervalMs: 10000,
  })

  useEffect(() => {
    if (streamedPayload != null) normalize(streamedPayload)
  }, [streamedPayload, normalize])

  useEffect(() => {
    if (!normalized) return
    setData(normalized)
    setIsLoading(false)
  }, [normalized])

  useEffect(() => {
    const safety = setTimeout(() => setIsLoading(false), 1500)

    fetchTelemetryPayload()
      .then((payload) => normalize(payload))
      .catch(() => {})
      .finally(() => setIsLoading(false))

    return () => clearTimeout(safety)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  useEffect(() => {
    curtailmentChartInstanceRef.current?.setOption(curtailmentOption)
  }, [curtailmentOption])

  const handleDirectionChange = (value) => {
    setUf(value)
    setRegiao(regionMap[value] || 'North')
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    const minSpin = new Promise((resolve) => setTimeout(resolve, 700))
    try {
      const payload = await fetchTelemetryPayload()
      normalize(payload)
    } catch {
      void 0
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
        defaultMode="Visão Executiva"
      />

      <div className="system-infos">
        <div className="left-sub-header">
          <h3 className="region">Region: {regiao}({uf})</h3>

         

          <h3 className="horizon">Horizon: {horizonte} </h3>
        </div>

        <div className="right-sub-header">
          <div className="last-model-update">
            <span>Last model update:</span>
            <strong>{formatUtcDate(new Date())}</strong>
          </div>

          
        </div>
      </div>

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
            <span className="kpi-unit">{kpis.volumeEolicoUnidade}</span>
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

      <div className="telemetry-content">
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

      <div className="simulation-row">
        <SimulationOutputChart simulation={simulationOutput} loading={isLoading} />
      </div>
      </div>
    </>
  )
}

export default TelemetryPage
