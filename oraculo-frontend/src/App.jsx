import './App.css'
import { useEffect, useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import TelemetryPage from './pages/TelemetryPage'
import Header from './components/header'
import api from './services/api'
import { ArrowRight, MonitorCog, Network, Play, Radar, Cpu, Server, Zap } from 'lucide-react'

const architectureSteps = [
  { title: 'Data Processing', detail: 'Load data', status: 'Ready', tone: 'muted' },
  { title: 'Backend Model', detail: 'Forecast', status: 'Ready', tone: 'success' },
  { title: 'Base Forecast', detail: 'Probabilistic', status: 'Ready', tone: 'warning' },
  { title: 'Generative Super Ensemble', detail: 'Generate outputs', status: 'Ready', tone: 'accent' },
  { title: 'Output & Evaluation', detail: 'Validate model', status: 'Ready', tone: 'info' },
]

const normalizeNumber = (value, fallback) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const defaultHomePayload = {
  baseForecast: 2400,
  bestCase: 2880,
  averageCase: 2400,
  worstCase: 1980,
  p10: 1850,
  p50: 2400,
  p90: 2960,
  scenarios: 108,
  curtailmentProbability: 78,
  expectedVolume: '328 MW / 1,280 MWh',
  highestRiskLocation: 'Northeast • Sobradinho',
  criticalWindow: '13:30 — 16:45',
  probableCause: 'Transmission (58%)',
  generationForecast: { mae: 126, rmse: 188, mape: '8.4%' },
  curtailmentOccurrence: { precision: 0.82, recall: 0.76, f1: 0.79 },
  restrictedVolume: { mae: 95, rmse: 140, error: '12.6%' },
  restrictionCause: { accuracy: 0.81, f1: 0.78, roc: 0.87 },
  architectureSteps,
}

function HomePage() {
  const [steps, setSteps] = useState(architectureSteps)
  const [baseForecast, setBaseForecast] = useState(defaultHomePayload.baseForecast)
  const [bestCase, setBestCase] = useState(defaultHomePayload.bestCase)
  const [averageCase, setAverageCase] = useState(defaultHomePayload.averageCase)
  const [worstCase, setWorstCase] = useState(defaultHomePayload.worstCase)
  const [p10, setP10] = useState(defaultHomePayload.p10)
  const [p50, setP50] = useState(defaultHomePayload.p50)
  const [p90, setP90] = useState(defaultHomePayload.p90)
  const [scenarios, setScenarios] = useState(defaultHomePayload.scenarios)
  const [curtailmentProbability, setCurtailmentProbability] = useState(defaultHomePayload.curtailmentProbability)
  const [expectedVolume, setExpectedVolume] = useState(defaultHomePayload.expectedVolume)
  const [highestRiskLocation, setHighestRiskLocation] = useState(defaultHomePayload.highestRiskLocation)
  const [criticalWindow, setCriticalWindow] = useState(defaultHomePayload.criticalWindow)
  const [probableCause, setProbableCause] = useState(defaultHomePayload.probableCause)
  const [generationForecast, setGenerationForecast] = useState(defaultHomePayload.generationForecast)
  const [curtailmentOccurrence, setCurtailmentOccurrence] = useState(defaultHomePayload.curtailmentOccurrence)
  const [restrictedVolume, setRestrictedVolume] = useState(defaultHomePayload.restrictedVolume)
  const [restrictionCause, setRestrictionCause] = useState(defaultHomePayload.restrictionCause)

  const applyHomeData = (payload = {}) => {
    const feed = {
      ...defaultHomePayload,
      ...payload,
      generationForecast: { ...defaultHomePayload.generationForecast, ...(payload.generationForecast || payload.forecast || {}) },
      curtailmentOccurrence: { ...defaultHomePayload.curtailmentOccurrence, ...(payload.curtailmentOccurrence || payload.curtailment || {}) },
      restrictedVolume: { ...defaultHomePayload.restrictedVolume, ...(payload.restrictedVolume || payload.volume || {}) },
      restrictionCause: { ...defaultHomePayload.restrictionCause, ...(payload.restrictionCause || payload.cause || {}) },
    }

    setSteps(Array.isArray(feed.architectureSteps) && feed.architectureSteps.length ? feed.architectureSteps : architectureSteps)
    setBaseForecast(normalizeNumber(feed.baseForecast ?? feed.generation?.baseForecast, defaultHomePayload.baseForecast))
    setBestCase(normalizeNumber(feed.bestCase ?? feed.generation?.bestCase, defaultHomePayload.bestCase))
    setAverageCase(normalizeNumber(feed.averageCase ?? feed.generation?.averageCase, defaultHomePayload.averageCase))
    setWorstCase(normalizeNumber(feed.worstCase ?? feed.generation?.worstCase, defaultHomePayload.worstCase))
    setP10(normalizeNumber(feed.p10 ?? feed.generation?.p10, defaultHomePayload.p10))
    setP50(normalizeNumber(feed.p50 ?? feed.generation?.p50, defaultHomePayload.p50))
    setP90(normalizeNumber(feed.p90 ?? feed.generation?.p90, defaultHomePayload.p90))
    setScenarios(normalizeNumber(feed.scenarios ?? feed.generation?.scenarios, defaultHomePayload.scenarios))
    setCurtailmentProbability(normalizeNumber(feed.curtailmentProbability ?? feed.curtailment?.probability, defaultHomePayload.curtailmentProbability))
    setExpectedVolume(String(feed.expectedVolume ?? feed.curtailment?.expectedVolume ?? defaultHomePayload.expectedVolume))
    setHighestRiskLocation(String(feed.highestRiskLocation ?? feed.location ?? defaultHomePayload.highestRiskLocation))
    setCriticalWindow(String(feed.criticalWindow ?? feed.window ?? defaultHomePayload.criticalWindow))
    setProbableCause(String(feed.probableCause ?? feed.cause ?? defaultHomePayload.probableCause))
    setGenerationForecast(feed.generationForecast)
    setCurtailmentOccurrence(feed.curtailmentOccurrence)
    setRestrictedVolume(feed.restrictedVolume)
    setRestrictionCause(feed.restrictionCause)
  }

  const fetchHomeData = async () => {
    const endpoints = ['data-models', 'data-telemetry', '/api/models', '/api/home', '/api/dashboard']

    for (const endpoint of endpoints) {
      try {
        const response = await api.get(endpoint)
        applyHomeData(response.data)
        return
      } catch (error) {
        console.warn(`Main page endpoint not available: ${endpoint}`, error)
      }
    }
  }

  useEffect(() => {
    fetchHomeData()
  }, [])

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

      <div className="home-toolbar">
        <div className="toolbar-stack">
          <label className="toolbar-field">
            <span>Region</span>
            <select defaultValue="Northeast">
              <option>Northeast</option>
              <option>North</option>
              <option>South</option>
            </select>
          </label>

          <label className="toolbar-field">
            <span>Horizon</span>
            <select defaultValue="D0 + D1">
              <option>D0 + D1</option>
              <option>D1 + D2</option>
              <option>Week</option>
            </select>
          </label>
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
            <small>Probabilistic renewable generation and curtailment inference pipeline running active</small>
          </div>

          <div className="pipeline-steps">
            {steps.map((step, index) => (
              <div className={`pipeline-card ${step.tone}`} key={step.title}>
                <div className="pipeline-card-header">
                  <span className="step-number">{index + 1}</span>
                  <span className="step-name">{step.title}</span>
                  <span className="step-toggle">▢</span>
                </div>

                <div className="pipeline-body">
                  <div className="mini-icon"><Cpu size={14} /></div>
                  <div className="step-detail">{step.detail}</div>
                </div>

                <div className="step-actions">
                  <button type="button" className="action-button shadowed">Run Step</button>
                  <button type="button" className="action-button">Run Stop</button>
                </div>
              </div>
            ))}
          </div>
          <section className="home-panel panel-forecast">
          <div className="panel-header-grid compact">
            
            <div className="panel-legend">
              <span><em>P90</em></span>
              <span><em>P50</em></span>
              <span><em>P10</em></span>
            </div>
          </div>

          <div className="forecast-grid">
            <div className="chart-panel">
              <svg viewBox="0 0 700 230" className="home-chart" role="img" aria-label="Forecast chart">
                {[0, 1, 2, 3, 4].map((tick) => {
                  const y = 20 + tick * 43
                  return <line key={tick} x1="18" y1={y} x2="680" y2={y} stroke="rgba(148, 163, 184, 0.16)" strokeDasharray="4 8" />
                })}

                <path d="M 18 150 C 120 120, 170 90, 240 70 S 360 52, 430 80 S 560 92, 680 110" fill="none" stroke="#f0b75e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M 18 160 C 120 142, 170 120, 240 90 S 360 72, 430 95 S 560 118, 680 124" fill="none" stroke="#5ed7ff" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <path d="M 18 175 C 120 156, 170 138, 240 118 S 360 92, 430 118 S 560 148, 680 144" fill="none" stroke="#f97616" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="8 8" />

                {[0, 1, 2, 3, 4, 5].map((tick) => {
                  const x = 70 + tick * 110
                  const labels = ['00h', '06h', '12h', '18h', '24h', '30h']
                  return <text key={tick} x={x} y="210" fill="rgba(214,222,234,0.75)" fontSize="11" textAnchor="middle">{labels[tick]}</text>
                })}
              </svg>
            </div>

            <div className="key-output-panel">
              <div className="metrics-grid">
                <div className="metric-box">
                  <span>Base Forecast</span>
                  <strong>{baseForecast.toLocaleString()} MW</strong>
                </div>
                <div className="metric-box cyan">
                  <span>Best Case</span>
                  <strong>{bestCase.toLocaleString()} MW</strong>
                </div>
                <div className="metric-box amber">
                  <span>Average Case</span>
                  <strong>{averageCase.toLocaleString()} MW</strong>
                </div>
                <div className="metric-box red">
                  <span>Worst Case</span>
                  <strong>{worstCase.toLocaleString()} MW</strong>
                </div>
              </div>

              <div className="mini-stat-row">
                <div className="mini-stat">
                  <span>P10</span>
                  <strong>{p10.toLocaleString()} MW</strong>
                </div>
                <div className="mini-stat">
                  <span>P50</span>
                  <strong>{p50.toLocaleString()} MW</strong>
                </div>
                <div className="mini-stat">
                  <span>P90</span>
                  <strong>{p90.toLocaleString()} MW</strong>
                </div>
                <div className="mini-stat">
                  <span>Scenarios</span>
                  <strong>{scenarios}</strong>
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
                    <span>{curtailmentProbability}%</span>
                  </div>
                  <div className="kpi-copy">
                    <strong>Curtailment Probability</strong>
                    <small>{curtailmentProbability}% severe</small>
                  </div>
                </div>

                <div className="summary-box">
                  <span className="box-icon">◌</span>
                  <div className="box-copy">
                    <strong>Expected Volume</strong>
                    <small>{expectedVolume}</small>
                  </div>
                </div>

                <div className="summary-box">
                  <span className="box-icon">◌</span>
                  <div className="box-copy">
                    <strong>Highest-Risk Location</strong>
                    <small>{highestRiskLocation}</small>
                  </div>
                </div>
              </div>

              <div className="cause-summary-box">
                <div className="cause-summary-row">
                  <span>Critical Window</span>
                  <strong>{criticalWindow}</strong>
                </div>
                <div className="cause-summary-row">
                  <span>Probable Cause</span>
                  <strong>{probableCause}</strong>
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
                <li><strong>MAE</strong><span>{generationForecast.mae} MW</span></li>
                <li><strong>RMSE</strong><span>{generationForecast.rmse} MW</span></li>
                <li><strong>MAPE</strong><span>{generationForecast.mape}</span></li>
              </ul>
            </div>

            <div className="metrics-panel">
              <div className="metrics-header">
                <span>Curtailment Occurrence</span>
                <span className="dot red" />
              </div>
              <ul>
                <li><strong>Precision</strong><span>{curtailmentOccurrence.precision}</span></li>
                <li><strong>Recall</strong><span>{curtailmentOccurrence.recall}</span></li>
                <li><strong>F1-Score</strong><span>{curtailmentOccurrence.f1}</span></li>
              </ul>
            </div>

            <div className="metrics-panel">
              <div className="metrics-header">
                <span>Restricted Volume</span>
                <span className="dot yellow" />
              </div>
              <ul>
                <li><strong>MAE</strong><span>{restrictedVolume.mae} MWh</span></li>
                <li><strong>RMSE</strong><span>{restrictedVolume.rmse} MWh</span></li>
                <li><strong>% Error</strong><span>{restrictedVolume.error}</span></li>
              </ul>
            </div>

            <div className="metrics-panel">
              <div className="metrics-header">
                <span>Restriction Cause</span>
                <span className="dot blue" />
              </div>
              <ul>
                <li><strong>Accuracy</strong><span>{restrictionCause.accuracy}</span></li>
                <li><strong>F1-Score (avg)</strong><span>{restrictionCause.f1}</span></li>
                <li><strong>ROC-AUC</strong><span>{restrictionCause.roc}</span></li>
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
