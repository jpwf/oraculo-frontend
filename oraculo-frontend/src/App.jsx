import './App.css'
import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import TelemetryPage from './pages/TelemetryPage'
import Header from './components/header'
import { fetchFirstAvailable } from './services/api'
import { normalizeHomePayload } from './utils/normalizeHome'
import { MonitorCog, Network, Radar, Cpu, Server, Boxes, Sparkles, MessageSquare, BarChart3 } from 'lucide-react'
import Skeleton from './components/Skeleton'
import ForecastChart from './components/ForecastChart'

const HOME_ENDPOINTS = ['data-models', 'data-telemetry', '/api/models', '/api/home', '/api/dashboard']

// Mesma ideia dos controles da TelemetryPage: selecao dirigida por estado,
// com Region acompanhando o submercado escolhido (submarket -> region).
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

// Icone por etapa do pipeline (foto de referencia do Motor de Previsao).
const stepIcons = {
  data: Boxes,
  model: Sparkles,
  forecast: MessageSquare,
  ensemble: Sparkles,
  output: BarChart3,
}

function HomePage() {
  // Estado consolidado: UM objeto normalizado (antes eram ~18 useState).
  // Ja inicia com os defaults resolvidos (inclui steps com Data Processing ativo).
  const [data, setData] = useState(() => normalizeHomePayload({}))
  // Loading das requisicoes: true ate a resposta chegar ou falhar.
  const [isLoading, setIsLoading] = useState(true)
  // Inputs do usuario ficam separados (nao vem da requisicao apos interacao).
  const [uf, setUf] = useState(data.uf)
  const [regiao, setRegiao] = useState(data.regiao)

  // Horizonte vem do dado normalizado (alimentado pela requisicao).
  const horizonte = data.horizonte
  const steps = data.steps

  const applyHomeData = (payload = {}) => {
    setData(normalizeHomePayload(payload))
  }

  useEffect(() => {
    // Ponto 1A + 2A: corre todos os endpoints em paralelo (resolve no 1o que
    // responder) e cancela a requisicao se o componente desmontar.
    const controller = new AbortController()
    // Teto de seguranca: nao deixa o skeleton preso se nada responder.
    const safety = setTimeout(() => setIsLoading(false), 1500)

    fetchFirstAvailable(HOME_ENDPOINTS, { signal: controller.signal, timeout: 30000 })
      .then(({ data }) => applyHomeData(data))
      .catch(() => {
        // Nenhum endpoint respondeu: mantem os defaults ja aplicados no estado.
      })
      .finally(() => {
        clearTimeout(safety)
        setIsLoading(false)
      })

    return () => {
      controller.abort()
      clearTimeout(safety)
    }
  }, [])

  // Mesma logica da TelemetryPage: ao trocar o submercado, Region acompanha.
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
        modeOptions={['VPP', 'MODELS']}
        defaultMode="MODELS"
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
              <span>Motor de Previsão de Renováveis</span>
            </div>
            <div className="panel-status">Model Ready</div>
          </div>

          <div className="subheading-row">
            <small className="pipeline-heading">MODEL ARCHITECTURE <em>(click on a step to run it)</em></small>
          </div>

          <div className="pipeline-steps">
            {steps.map((step, index) => {
              const StepIcon = stepIcons[step.iconKey] || Cpu
              return (
                <div className={`pipeline-card ${step.active ? 'active' : ''}`} key={step.title}>
                  {step.active && <span className="pipeline-badge">ACTIVE</span>}

                  <div className="pipeline-card-header">
                    <span className="step-number">{index + 1}</span>
                    <span className="step-name">{step.title}</span>
                    <span className="pipeline-card-icon"><StepIcon size={15} /></span>
                  </div>

                  <ul className="pipeline-list">
                    {step.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>

                  <button type="button" className="pipeline-run-button">Run Step</button>
                </div>
              )
            })}
          </div>
          <section className="home-panel panel-forecast">
          <div className="forecast-grid">
            <div className="chart-panel">
              <div className="chart-panel-head">
                <span className="chart-panel-title">Simulation Output — Generation Forecast</span>
                <div className="forecast-legend">
                  <span className="legend-item p90"><i /> P90</span>
                  <span className="legend-item p50"><i /> P50 (Avg)</span>
                  <span className="legend-item p10"><i /> P10</span>
                  <span className="legend-item scenarios"><i /> Scenarios</span>
                </div>
              </div>

              {/* Grafico plotado a partir dos dados (request) com tooltip no hover. */}
              <ForecastChart hours={data.forecastHours} series={data.forecastSeries} />
            </div>

            <div className="key-output-panel">
              <div className="key-output-title">Key Outputs</div>

              <div className="metrics-grid">
                <div className="metric-box">
                  <span>Base Forecast</span>
                  <strong><Skeleton loading={isLoading} width={70} height={24}>{data.baseForecast.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="metric-box green">
                  <span>Best Case</span>
                  <strong><Skeleton loading={isLoading} width={70} height={24}>{data.bestCase.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="metric-box cyan">
                  <span>Average Case</span>
                  <strong><Skeleton loading={isLoading} width={70} height={24}>{data.averageCase.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="metric-box red">
                  <span>Worst Case</span>
                  <strong><Skeleton loading={isLoading} width={70} height={24}>{data.worstCase.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
              </div>

              <div className="mini-stat-row">
                <div className="mini-stat">
                  <span>P10</span>
                  <strong><Skeleton loading={isLoading} width={60}>{data.p10.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="mini-stat active">
                  <span>P50</span>
                  <strong><Skeleton loading={isLoading} width={60}>{data.p50.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="mini-stat">
                  <span>P90</span>
                  <strong><Skeleton loading={isLoading} width={60}>{data.p90.toLocaleString()} <small>MW</small></Skeleton></strong>
                </div>
                <div className="mini-stat">
                  <span># Scenarios</span>
                  <strong><Skeleton loading={isLoading} width={36}>{data.scenarios}</Skeleton></strong>
                </div>
              </div>
            </div>
          </div>
         </section>
        </section>

        

        <section className="home-panel model-two-panel">
          <div className="model-panel-header">
            <div className="panel-title-wrap">
              <span className="panel-bullet" />
              <span>Model 2 — Curtailment Forecast</span>
            </div>
            <div className="panel-status">Model Ready</div>
          </div>

          <div className="model-panel-subtitle">
            Predicts probability, volume, location and cause of renewable curtailment.
          </div>

          <div className="model-architecture-block">
            {[
              {
                step: '1',
                title: 'Scenario Ingestion',
                items: ['Load generation scenarios', 'P10 / P50 / P90', 'Feature preparation'],
                icon: <MonitorCog size={14} />,
              },
              {
                step: '2',
                title: 'System & Network',
                items: ['Load operation data', 'Transmission limits', 'Operating conditions'],
                icon: <Network size={14} />,
              },
              {
                step: '3',
                title: 'Curtailment Model',
                items: ['GNN / XGBoost / LSTM', 'Transformer', 'Train / Run model'],
                icon: <Cpu size={14} />,
              },
              {
                step: '4',
                title: 'Risk Estimation',
                items: ['Probability of occurrence', 'Restricted volume', 'Location and cause'],
                icon: <Radar size={14} />,
              },
              {
                step: '5',
                title: 'Output & Evaluation',
                items: ['Generate results', 'Save outputs', 'Evaluate performance'],
                icon: <Server size={14} />,
              },
            ].map((item) => (
              <div className="model-architecture-card" key={item.step}>
                <div className="card-title-row">
                  <span className="step-badge">{item.step}</span>
                  <span className="card-title-text">{item.title}</span>
                  <span className="card-mini-icon">{item.icon}</span>
                </div>

                <ul className="card-list">
                  {item.items.map((entry) => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>

                <button type="button" className="run-step-button">Run Step</button>
              </div>
            ))}
          </div>

          <div className="model-two-grid">
            <div className="model-two-chart-panel">
              <div className="model-two-chart-header">
                <span className="chart-label strong">Renewable Generation</span>
                <span className="chart-label">System Absorption</span>
                <span className="chart-label danger">Curtailment Risk</span>
              </div>

              <svg viewBox="0 0 700 220" className="model-two-chart" role="img" aria-label="Curtailment forecast chart">
                {[0, 1, 2, 3, 4].map((tick) => {
                  const y = 18 + tick * 40
                  return <line key={tick} x1="20" y1={y} x2="680" y2={y} stroke="rgba(148,163,184,0.14)" strokeDasharray="4 6" />
                })}

                <path d="M 20 135 C 120 118, 170 100, 240 92 S 330 72, 410 86 S 540 86, 680 82" fill="none" stroke="#f6b746" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M 20 150 C 130 138, 185 120, 250 108 S 350 90, 430 100 S 530 112, 680 110" fill="none" stroke="#63d6ff" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M 20 172 C 100 162, 170 156, 240 150 S 328 136, 410 134 S 540 120, 680 122" fill="none" stroke="#ff706b" strokeWidth="2.8" strokeDasharray="8 8" strokeLinejoin="round" strokeLinecap="round" />

                {[0, 1, 2, 3, 4].map((tick) => {
                  const x = 100 + tick * 130
                  const labels = ['00h', '06h', '12h', '18h', '24h']
                  return <text key={tick} x={x} y="206" fill="rgba(214,222,234,0.72)" fontSize="11" textAnchor="middle">{labels[tick]}</text>
                })}
              </svg>
            </div>

            <aside className="model-two-summary">
              <div className="summary-kpi-grid">
                <div className="summary-kpi danger">
                  <div className="kpi-ring">
                    <span><Skeleton loading={isLoading} width={40}>{data.curtailmentProbability}%</Skeleton></span>
                  </div>
                  <div className="kpi-copy">
                    <strong>Curtailment Probability</strong>
                    <small><Skeleton loading={isLoading} width={80}>{data.curtailmentProbability}% severe</Skeleton></small>
                  </div>
                </div>

                <div className="summary-box">
                  <span className="box-icon">◌</span>
                  <div className="box-copy">
                    <strong>Expected Volume</strong>
                    <small><Skeleton loading={isLoading} width={130}>{data.expectedVolume}</Skeleton></small>
                  </div>
                </div>

                <div className="summary-box">
                  <span className="box-icon">◌</span>
                  <div className="box-copy">
                    <strong>Highest-Risk Location</strong>
                    <small><Skeleton loading={isLoading} width={140}>{data.highestRiskLocation}</Skeleton></small>
                  </div>
                </div>
              </div>

              <div className="cause-summary-box">
                <div className="cause-summary-row">
                  <span>Critical Window</span>
                  <strong><Skeleton loading={isLoading} width={90}>{data.criticalWindow}</Skeleton></strong>
                </div>
                <div className="cause-summary-row">
                  <span>Probable Cause</span>
                  <strong><Skeleton loading={isLoading} width={110}>{data.probableCause}</Skeleton></strong>
                </div>
              </div>
            </aside>
          </div>

        </section>

        <section className="home-panel model-performance-panel">
          <div className="model-panel-header">
            <div className="panel-title-wrap">
              <span className="panel-bullet" />
              <span>Model Performance</span>
            </div>
            <div className="panel-status">Model Ready</div>
          </div>

          <div className="model-panel-subtitle">
            Benchmark metrics for generation forecast, risk detection and curtailment attribution.
          </div>

          <div className="model-metrics-row">
            <div className="metrics-panel">
              <div className="metrics-header">
                <span>Generation Forecast</span>
                <span className="dot green" />
              </div>
              <ul>
                <li><strong>MAE</strong><span><Skeleton loading={isLoading} width={50}>{data.generationForecast.mae} MW</Skeleton></span></li>
                <li><strong>RMSE</strong><span><Skeleton loading={isLoading} width={50}>{data.generationForecast.rmse} MW</Skeleton></span></li>
                <li><strong>MAPE</strong><span><Skeleton loading={isLoading} width={40}>{data.generationForecast.mape}</Skeleton></span></li>
              </ul>
            </div>

            <div className="metrics-panel">
              <div className="metrics-header">
                <span>Curtailment Occurrence</span>
                <span className="dot red" />
              </div>
              <ul>
                <li><strong>Precision</strong><span><Skeleton loading={isLoading} width={40}>{data.curtailmentOccurrence.precision}</Skeleton></span></li>
                <li><strong>Recall</strong><span><Skeleton loading={isLoading} width={40}>{data.curtailmentOccurrence.recall}</Skeleton></span></li>
                <li><strong>F1-Score</strong><span><Skeleton loading={isLoading} width={40}>{data.curtailmentOccurrence.f1}</Skeleton></span></li>
              </ul>
            </div>

            <div className="metrics-panel">
              <div className="metrics-header">
                <span>Restricted Volume</span>
                <span className="dot yellow" />
              </div>
              <ul>
                <li><strong>MAE</strong><span><Skeleton loading={isLoading} width={55}>{data.restrictedVolume.mae} MWh</Skeleton></span></li>
                <li><strong>RMSE</strong><span><Skeleton loading={isLoading} width={55}>{data.restrictedVolume.rmse} MWh</Skeleton></span></li>
                <li><strong>% Error</strong><span><Skeleton loading={isLoading} width={45}>{data.restrictedVolume.error}</Skeleton></span></li>
              </ul>
            </div>

            <div className="metrics-panel">
              <div className="metrics-header">
                <span>Restriction Cause</span>
                <span className="dot blue" />
              </div>
              <ul>
                <li><strong>Accuracy</strong><span><Skeleton loading={isLoading} width={40}>{data.restrictionCause.accuracy}</Skeleton></span></li>
                <li><strong>F1-Score (avg)</strong><span><Skeleton loading={isLoading} width={40}>{data.restrictionCause.f1}</Skeleton></span></li>
                <li><strong>ROC-AUC</strong><span><Skeleton loading={isLoading} width={40}>{data.restrictionCause.roc}</Skeleton></span></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="data-flow-section">
          <div className="data-flow-title">
            <span className="data-flow-arrow">›</span>
            <span>Data Flow</span>
          </div>

          <div className="data-flow-row">
            <div className="data-flow-card">
              <span>Data Sources</span>
              <small>(Met, Assets, SIN, Grid)</small>
            </div>

            <div className="data-flow-arrow-pill">→</div>

            <div className="data-flow-card">
              <span>Generation Forecast</span>
              <small>(Backbone Model)</small>
            </div>

            <div className="data-flow-arrow-pill">→</div>

            <div className="data-flow-card active">
              <span>Generative Scenarios</span>
              <small>(N Trajectories)</small>
            </div>

            <div className="data-flow-arrow-pill">→</div>

            <div className="data-flow-card">
              <span>Curtailment Forecast</span>
              <small>(Risk Estimation)</small>
            </div>

            <div className="data-flow-arrow-pill">→</div>

            <div className="data-flow-card">
              <span>Operational Intelligence</span>
              <small>(VPP Dashboard)</small>
              <span className="status-check">✓</span>
            </div>
          </div>
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
