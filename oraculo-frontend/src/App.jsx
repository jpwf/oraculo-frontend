import './App.css'
import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import TelemetryPage from './pages/TelemetryPage'
import Header from './components/header'
import { fetchFirstAvailable } from './services/api'
import { normalizeHomePayload } from './utils/normalizeHome'
import { MonitorCog, Network, Radar, Cpu, Server, Boxes, Sparkles, MessageSquare, BarChart3 } from 'lucide-react'
import Skeleton from './components/Skeleton'
import ForecastVsObservedChart from './components/ForecastVsObservedChart'

const HOME_ENDPOINTS = ['data-models', 'data-telemetry', '/api/models', '/api/home', '/api/dashboard']

const submarketOptions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

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

const stepIcons = {
  data: Boxes,
  model: Sparkles,
  forecast: MessageSquare,
  ensemble: Sparkles,
  output: BarChart3,
}

function HomePage() {
  const [data, setData] = useState(() => normalizeHomePayload({}))
  const [isLoading, setIsLoading] = useState(true)
  const [uf, setUf] = useState(data.uf)
  const [regiao, setRegiao] = useState(data.regiao)
  const [selectedAssetId, setSelectedAssetId] = useState(null)

  const horizonte = data.horizonte
  const steps = data.steps

  const assetForecast = data.assetForecast || []
  const selectedAsset =
    assetForecast.find((asset) => asset.id === selectedAssetId) || assetForecast[0] || null

  const metrics = selectedAsset?.metrics || {
    baseForecast: data.baseForecast,
    bestCase: data.bestCase,
    averageCase: data.averageCase,
    worstCase: data.worstCase,
    p10: data.p10,
    p50: data.p50,
    p90: data.p90,
    scenarios: data.scenarios,
  }

  const applyHomeData = (payload = {}) => {
    setData(normalizeHomePayload(payload))
  }

  useEffect(() => {
    const controller = new AbortController()
    const safety = setTimeout(() => setIsLoading(false), 1500)

    fetchFirstAvailable(HOME_ENDPOINTS, { signal: controller.signal, timeout: 30000 })
      .then(({ data }) => applyHomeData(data))
      .catch(() => {})
      .finally(() => {
        clearTimeout(safety)
        setIsLoading(false)
      })

    return () => {
      controller.abort()
      clearTimeout(safety)
    }
  }, [])

  const handleSubmarketChange = (value) => {
    setUf(value)
    setRegiao(regionMap[value] || 'North')
  }

  return (
    <div className="home-app-shell">
      <Header
        system_status="online"
        initialLatency={18}
        title="ORÁCULO"
        dispatchText="ISO DISPATCH V4.18"
        modeOptions={['Visão Detalhada', 'Visão Executiva']}
        defaultMode="Visão Detalhada"
      />

      <div className="system-infos">
        <div className="left-sub-header">
          <h3 className="region">Region: {regiao}({uf})</h3>

          <label className="field uf-field">
            <span>Submarket:</span>
            <select className="uf" value={uf} onChange={(event) => handleSubmarketChange(event.target.value)}>
              {submarketOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <h3 className="horizon">Horizon: {horizonte} </h3>
        </div>
      </div>

      <main className="home-main-wrapper">
        <section className="home-panel panel-large">
          <div className="panel-header-grid">
            <div className="panel-title-wrap">
              <span className="panel-bullet" />
              <span>Dados das usinas</span>
            </div>
            
          </div>
           
          <section className="home-panel panel-forecast">
          <div className="forecast-grid">
            <div className="chart-panel">
              <div className="chart-panel-head">
                <span className="chart-panel-title">Geração por Usina — Previsto vs. Observado</span>

                <div className="asset-select">
                  <span>Usina:</span>
                  <select
                    value={selectedAsset?.id ?? ''}
                    onChange={(event) => setSelectedAssetId(event.target.value)}
                    disabled={!assetForecast.length}
                  >
                    {assetForecast.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}{asset.uf ? ` (${asset.uf})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ForecastVsObservedChart
                hours={data.assetForecastHours}
                forecast={selectedAsset?.forecast}
                observed={selectedAsset?.observed}
              />
            </div>

            <div className="key-output-panel">
              <div className="key-output-title">Key Outputs</div>

              <div className="metrics-grid">
                <div className="metric-box">
                  <span>Base Forecast</span>
                  <strong><Skeleton loading={isLoading} width={70} height={24}>{metrics.baseForecast.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="metric-box green">
                  <span>Best Case</span>
                  <strong><Skeleton loading={isLoading} width={70} height={24}>{metrics.bestCase.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="metric-box cyan">
                  <span>Average Case</span>
                  <strong><Skeleton loading={isLoading} width={70} height={24}>{metrics.averageCase.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="metric-box red">
                  <span>Worst Case</span>
                  <strong><Skeleton loading={isLoading} width={70} height={24}>{metrics.worstCase.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
              </div>

              <div className="mini-stat-row">
                <div className="mini-stat">
                  <span>P10</span>
                  <strong><Skeleton loading={isLoading} width={60}>{metrics.p10.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="mini-stat active">
                  <span>P50</span>
                  <strong><Skeleton loading={isLoading} width={60}>{metrics.p50.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="mini-stat">
                  <span>P90</span>
                  <strong><Skeleton loading={isLoading} width={60}>{metrics.p90.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="mini-stat">
                  <span># Scenarios</span>
                  <strong><Skeleton loading={isLoading} width={36}>{metrics.scenarios}</Skeleton></strong>
                </div>
              </div>
            </div>
          </div>
         </section>
        </section>

        

      

        

        
      </main>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/telemetry" element={<TelemetryPage />} />
    </Routes>
  )
}

export default App
