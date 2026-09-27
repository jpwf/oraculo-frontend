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

export const resolveActiveSteps = (steps, payload = {}) => {
  const list = Array.isArray(steps) && steps.length ? steps : architectureSteps

  const rawActive = payload.activeStep ?? payload.activeIndex ?? payload.currentStep

  let activeIndex = -1

  const embedded = list.findIndex((step) => step && step.active === true)
  if (embedded !== -1) {
    activeIndex = embedded
  }

  if (activeIndex === -1 && (typeof rawActive === 'number' || /^\d+$/.test(String(rawActive ?? '')))) {
    const idx = Number(rawActive)
    if (Number.isInteger(idx) && idx >= 0 && idx < list.length) {
      activeIndex = idx
    }
  }

  if (activeIndex === -1 && typeof rawActive === 'string' && rawActive.trim()) {
    const target = rawActive.trim().toLowerCase()
    const byTitle = list.findIndex((step) => String(step?.title || '').toLowerCase() === target)
    if (byTitle !== -1) {
      activeIndex = byTitle
    }
  }

  if (activeIndex === -1) {
    activeIndex = 0
  }

  return list.map((step, index) => ({ ...step, active: index === activeIndex }))
}

export const normalizeNumber = (value, fallback) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const normalizeSeriesArray = (source, fallback) => {
  if (!Array.isArray(source) || source.length === 0) return fallback
  return source.map((v) => normalizeNumber(v, 0))
}

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

export const defaultForecastHours = ['00h', '03h', '06h', '09h', '12h', '15h', '18h', '21h', '24h']
export const defaultForecastSeries = {
  p90: [1050, 1600, 2250, 2900, 3350, 3300, 2950, 2300, 1450],
  p50: [900, 1350, 1950, 2500, 2900, 2850, 2500, 1950, 1200],
  p10: [720, 1050, 1500, 1950, 2250, 2200, 1900, 1450, 900],
}

export const defaultAssetForecastHours = [
  '00h', '02h', '04h', '06h', '08h', '10h', '12h',
  '14h', '16h', '18h', '20h', '22h', '24h',
]

export const defaultAssetForecast = [
  {
    id: 'cacamari', name: 'Parque Eólico Caçamari', uf: 'BA',
    forecast: [180, 140, 120, 340, 980, 1880, 2620, 2760, 2480, 1880, 1020, 420, 190],
    observed: [168, 132, 138, 372, 1050, 1790, 2540, 2700, 2410, null, null, null, null],
    metrics: {
      baseForecast: 2760, bestCase: 3280, averageCase: 2620, worstCase: 2010,
      p10: 2010, p50: 2620, p90: 3280, scenarios: 128,
      curtailmentProbability: 82,
      expectedVolume: '412 MW / 1,640 MWh',
      highestRiskLocation: 'Bahia • Sobradinho',
      criticalWindow: '13:30 — 16:45',
      probableCause: 'Transmission (61%)',
      generationForecast: { mae: 142, rmse: 205, mape: '7.9%' },
      curtailmentOccurrence: { precision: 0.85, recall: 0.79, f1: 0.82 },
      restrictedVolume: { mae: 108, rmse: 158, error: '11.4%' },
      restrictionCause: { accuracy: 0.84, f1: 0.80, roc: 0.89 },
    },
  },
  {
    id: 'sertao', name: 'Parque Eólico Sertão', uf: 'PE',
    forecast: [90, 70, 60, 160, 480, 940, 1300, 1360, 1220, 940, 500, 200, 90],
    observed: [96, 66, 72, 150, 505, 900, 1250, 1300, 1180, null, null, null, null],
    metrics: {
      baseForecast: 1360, bestCase: 1680, averageCase: 1300, worstCase: 980,
      p10: 980, p50: 1300, p90: 1680, scenarios: 96,
      curtailmentProbability: 64,
      expectedVolume: '236 MW / 940 MWh',
      highestRiskLocation: 'Pernambuco • Luiz Gonzaga',
      criticalWindow: '12:00 — 15:00',
      probableCause: 'Transmission (52%)',
      generationForecast: { mae: 98, rmse: 146, mape: '9.2%' },
      curtailmentOccurrence: { precision: 0.78, recall: 0.71, f1: 0.74 },
      restrictedVolume: { mae: 82, rmse: 121, error: '13.8%' },
      restrictionCause: { accuracy: 0.77, f1: 0.73, roc: 0.83 },
    },
  },
  {
    id: 'acu', name: 'Parque Eólico Açu', uf: 'RN',
    forecast: [40, 30, 26, 70, 190, 360, 500, 520, 470, 360, 200, 80, 42],
    observed: [36, 34, 30, 64, 178, 348, 486, 512, 448, null, null, null, null],
    metrics: {
      baseForecast: 520, bestCase: 660, averageCase: 500, worstCase: 360,
      p10: 360, p50: 500, p90: 660, scenarios: 72,
      curtailmentProbability: 38,
      expectedVolume: '84 MW / 336 MWh',
      highestRiskLocation: 'Rio Grande do Norte • Açu',
      criticalWindow: '11:00 — 13:30',
      probableCause: 'Grid (44%)',
      generationForecast: { mae: 54, rmse: 82, mape: '11.6%' },
      curtailmentOccurrence: { precision: 0.70, recall: 0.63, f1: 0.66 },
      restrictedVolume: { mae: 41, rmse: 63, error: '17.2%' },
      restrictionCause: { accuracy: 0.72, f1: 0.68, roc: 0.79 },
    },
  },
]

export const resolveAssetForecast = (payload = {}) => {
  const source = payload.assetForecast ?? payload.assets ?? payload.usinas
  const hoursRaw = payload.assetForecastHours
  const hours = Array.isArray(hoursRaw) && hoursRaw.length ? hoursRaw.map(String) : defaultAssetForecastHours
  const len = hours.length

  const list = Array.isArray(source) && source.length ? source : defaultAssetForecast

  const toSeries = (value) => {
    if (!Array.isArray(value)) return Array.from({ length: len }, () => null)
    return Array.from({ length: len }, (_, i) => {
      const v = value[i]
      if (v === null || v === undefined || v === '') return null
      return normalizeNumber(v, null)
    })
  }

  const toMetrics = (m) => {
    const src = m && typeof m === 'object' ? m : {}
    return {
      baseForecast: normalizeNumber(src.baseForecast, defaultHomePayload.baseForecast),
      bestCase: normalizeNumber(src.bestCase, defaultHomePayload.bestCase),
      averageCase: normalizeNumber(src.averageCase, defaultHomePayload.averageCase),
      worstCase: normalizeNumber(src.worstCase, defaultHomePayload.worstCase),
      p10: normalizeNumber(src.p10, defaultHomePayload.p10),
      p50: normalizeNumber(src.p50, defaultHomePayload.p50),
      p90: normalizeNumber(src.p90, defaultHomePayload.p90),
      scenarios: normalizeNumber(src.scenarios, defaultHomePayload.scenarios),
      curtailmentProbability: normalizeNumber(src.curtailmentProbability, defaultHomePayload.curtailmentProbability),
      expectedVolume: String(src.expectedVolume ?? defaultHomePayload.expectedVolume),
      highestRiskLocation: String(src.highestRiskLocation ?? defaultHomePayload.highestRiskLocation),
      criticalWindow: String(src.criticalWindow ?? defaultHomePayload.criticalWindow),
      probableCause: String(src.probableCause ?? defaultHomePayload.probableCause),
      generationForecast: { ...defaultHomePayload.generationForecast, ...(src.generationForecast || {}) },
      curtailmentOccurrence: { ...defaultHomePayload.curtailmentOccurrence, ...(src.curtailmentOccurrence || {}) },
      restrictedVolume: { ...defaultHomePayload.restrictedVolume, ...(src.restrictedVolume || {}) },
      restrictionCause: { ...defaultHomePayload.restrictionCause, ...(src.restrictionCause || {}) },
    }
  }

  const assets = list
    .map((asset, index) => {
      if (!asset || typeof asset !== 'object') return null
      return {
        id: String(asset.id ?? asset.name ?? `usina-${index}`),
        name: String(asset.name ?? asset.label ?? `Usina ${index + 1}`),
        uf: asset.uf ? String(asset.uf).toUpperCase() : null,
        forecast: toSeries(asset.forecast ?? asset.previsto ?? asset.predicted),
        observed: toSeries(asset.observed ?? asset.observado ?? asset.realized ?? asset.actual),
        metrics: toMetrics(asset.metrics),
      }
    })
    .filter(Boolean)

  return { hours, assets: assets.length ? assets : [] }
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
  const assetForecast = resolveAssetForecast(payload)

  return {
    steps: resolveActiveSteps(baseSteps, payload),
    forecastHours: forecast.hours,
    forecastSeries: forecast.series,
    assetForecastHours: assetForecast.hours,
    assetForecast: assetForecast.assets,
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
