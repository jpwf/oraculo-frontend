// Funcoes puras de normalizacao da HomePage (motor de previsao).
// Sem hooks / sem React.

// iconKey mapeia para um icone lucide na camada de apresentacao (App.jsx).
// O `active` NAO fica fixo aqui: e resolvido a partir do request
// (ver resolveActiveSteps). Default = primeiro step (Data Processing).
export const architectureSteps = [
  {
    title: 'Data Processing',
    items: ['Load data', 'Clean & validate', 'Feature engineering'],
    iconKey: 'data',
  },
  {
    title: 'Backbone Model',
    items: ['LSTM / XGBoost /', 'LightGBM / Transformer'],
    iconKey: 'model',
  },
  {
    title: 'Base Forecast',
    items: ['Point forecast', 'MW by horizon'],
    iconKey: 'forecast',
  },
  {
    title: 'Generative SuperEnsemble',
    items: ['N trajectories', 'Probabilistic scenarios', 'P10 / P50 / P90'],
    iconKey: 'ensemble',
  },
  {
    title: 'Output & Evaluation',
    items: ['Generate results', 'Save model', 'Evaluate performance'],
    iconKey: 'output',
  },
]

// Resolve qual step esta ativo a partir do que o request trouxer.
// Aceita (em ordem de prioridade):
//   1. um `active: true` embutido em algum item de `steps`
//   2. `activeIndex`/`activeStep` numerico (indice, base 0)
//   3. `activeStep`/`activeStepTitle` string (casa com o title, case-insensitive)
// Se nada casar, o primeiro step (indice 0 = Data Processing) fica ativo.
export const resolveActiveSteps = (steps, payload = {}) => {
  const list = Array.isArray(steps) && steps.length ? steps : architectureSteps

  const rawActive = payload.activeStep ?? payload.activeIndex ?? payload.currentStep

  let activeIndex = -1

  // 1. active embutido em cada step
  const embedded = list.findIndex((step) => step && step.active === true)
  if (embedded !== -1) {
    activeIndex = embedded
  }

  // 2. indice numerico
  if (activeIndex === -1 && (typeof rawActive === 'number' || /^\d+$/.test(String(rawActive ?? '')))) {
    const idx = Number(rawActive)
    if (Number.isInteger(idx) && idx >= 0 && idx < list.length) {
      activeIndex = idx
    }
  }

  // 3. titulo (string)
  if (activeIndex === -1 && typeof rawActive === 'string' && rawActive.trim()) {
    const target = rawActive.trim().toLowerCase()
    const byTitle = list.findIndex((step) => String(step?.title || '').toLowerCase() === target)
    if (byTitle !== -1) {
      activeIndex = byTitle
    }
  }

  // default: primeiro step
  if (activeIndex === -1) {
    activeIndex = 0
  }

  return list.map((step, index) => ({ ...step, active: index === activeIndex }))
}

export const normalizeNumber = (value, fallback) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

// Normaliza um array numerico da series de forecast; usa o default se invalido.
const normalizeSeriesArray = (source, fallback) => {
  if (!Array.isArray(source) || source.length === 0) return fallback
  return source.map((v) => normalizeNumber(v, 0))
}

// Resolve as series do grafico (P10/P50/P90 + horas) a partir do payload,
// caindo nos defaults quando algo faltar.
export const resolveForecastSeries = (payload = {}) => {
  const src = payload.forecastSeries ?? payload.forecast?.series ?? {}
  return {
    hours:
      Array.isArray(payload.forecastHours) && payload.forecastHours.length
        ? payload.forecastHours.map(String)
        : defaultForecastHours,
    series: {
      p90: normalizeSeriesArray(src.p90 ?? payload.p90Series, defaultForecastSeries.p90),
      p50: normalizeSeriesArray(src.p50 ?? payload.p50Series, defaultForecastSeries.p50),
      p10: normalizeSeriesArray(src.p10 ?? payload.p10Series, defaultForecastSeries.p10),
    },
  }
}

// Series default do grafico "Simulation Output" (P10/P50/P90 ao longo do dia).
// Valores em MW por hora (00h..24h). Refletem o formato das curvas atuais.
export const defaultForecastHours = ['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h', '24h']
export const defaultForecastSeries = {
  p90: [1050, 1600, 2250, 2900, 3350, 3300, 2950, 2300, 1450],
  p50: [900, 1350, 1950, 2500, 2900, 2850, 2500, 1950, 1200],
  p10: [720, 1050, 1500, 1950, 2250, 2200, 1900, 1450, 900],
}

export const defaultHomePayload = {
  regiao: 'Northeast',
  uf: 'NE',
  horizonte: 'D0 + D1',
  forecastHours: defaultForecastHours,
  forecastSeries: defaultForecastSeries,
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

// Recebe o payload cru da API e devolve o estado ja resolvido/normalizado
// para a HomePage consumir sem logica adicional.
export const normalizeHomePayload = (payload = {}) => {
  const feed = {
    ...defaultHomePayload,
    ...payload,
    generationForecast: { ...defaultHomePayload.generationForecast, ...(payload.generationForecast || payload.forecast || {}) },
    curtailmentOccurrence: { ...defaultHomePayload.curtailmentOccurrence, ...(payload.curtailmentOccurrence || payload.curtailment || {}) },
    restrictedVolume: { ...defaultHomePayload.restrictedVolume, ...(payload.restrictedVolume || payload.volume || {}) },
    restrictionCause: { ...defaultHomePayload.restrictionCause, ...(payload.restrictionCause || payload.cause || {}) },
  }

  const baseSteps =
    Array.isArray(feed.architectureSteps) && feed.architectureSteps.length ? feed.architectureSteps : architectureSteps

  const forecast = resolveForecastSeries(payload)

  return {
    // `active` resolvido a partir do request; default = primeiro step.
    steps: resolveActiveSteps(baseSteps, payload),
    forecastHours: forecast.hours,
    forecastSeries: forecast.series,
    regiao: String(feed.regiao ?? feed.region ?? feed.area ?? defaultHomePayload.regiao),
    uf: String(feed.uf ?? feed.submarket ?? feed.state ?? defaultHomePayload.uf),
    horizonte: String(feed.horizonte ?? feed.horizon ?? defaultHomePayload.horizonte),
    baseForecast: normalizeNumber(feed.baseForecast ?? feed.generation?.baseForecast, defaultHomePayload.baseForecast),
    bestCase: normalizeNumber(feed.bestCase ?? feed.generation?.bestCase, defaultHomePayload.bestCase),
    averageCase: normalizeNumber(feed.averageCase ?? feed.generation?.averageCase, defaultHomePayload.averageCase),
    worstCase: normalizeNumber(feed.worstCase ?? feed.generation?.worstCase, defaultHomePayload.worstCase),
    p10: normalizeNumber(feed.p10 ?? feed.generation?.p10, defaultHomePayload.p10),
    p50: normalizeNumber(feed.p50 ?? feed.generation?.p50, defaultHomePayload.p50),
    p90: normalizeNumber(feed.p90 ?? feed.generation?.p90, defaultHomePayload.p90),
    scenarios: normalizeNumber(feed.scenarios ?? feed.generation?.scenarios, defaultHomePayload.scenarios),
    curtailmentProbability: normalizeNumber(feed.curtailmentProbability ?? feed.curtailment?.probability, defaultHomePayload.curtailmentProbability),
    expectedVolume: String(feed.expectedVolume ?? feed.curtailment?.expectedVolume ?? defaultHomePayload.expectedVolume),
    highestRiskLocation: String(feed.highestRiskLocation ?? feed.location ?? defaultHomePayload.highestRiskLocation),
    criticalWindow: String(feed.criticalWindow ?? feed.window ?? defaultHomePayload.criticalWindow),
    probableCause: String(feed.probableCause ?? feed.cause ?? defaultHomePayload.probableCause),
    generationForecast: feed.generationForecast,
    curtailmentOccurrence: feed.curtailmentOccurrence,
    restrictedVolume: feed.restrictedVolume,
    restrictionCause: feed.restrictionCause,
  }
}
