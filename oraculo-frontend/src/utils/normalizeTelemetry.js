export const defaultRiskPoints = [
  { label: 'High Risk', value: '78%', color: '#ef4444' },
  { label: 'Medium Risk', value: '42%', color: '#f59e0b' },
  { label: 'Low Risk', value: '18%', color: '#38bdf8' },
]

export const defaultMapResources = [
  { type: 'WIND', name: 'Parque Eólico Caçamari', estado: 'BA', quantity: 180, coordinates: [-41.0, -11.2], color: '#38bdf8' },
  { type: 'WIND', name: 'Parque Eólico Sertão', estado: 'PE', quantity: 150, coordinates: [-38.3, -8.4], color: '#38bdf8' },
  { type: 'SOLAR_PLANT', name: 'Usina Solar Piauí', estado: 'PI', quantity: 210, coordinates: [-42.8, -7.6], color: '#f59e0b' },
  { type: 'SOLAR_PLANT', name: 'Usina Solar Ceará', estado: 'CE', quantity: 140, coordinates: [-39.4, -5.2], color: '#f59e0b' },
  { type: 'MMGD', name: 'MMGD Maranhão', estado: 'MA', quantity: 95, coordinates: [-45.0, -5.0], color: '#34d399' },
  { type: 'BESS', name: 'BESS Sobradinho', estado: 'BA', quantity: 120, coordinates: [-40.8, -9.6], color: '#a78bfa' },
]

export const defaultCauseRows = [
  { label: 'Transmissão', value: 58, color: '#ff5a5a' },
  { label: 'Elétrica', value: 24, color: '#4ecae6' },
  { label: 'Energia', value: 12, color: '#f5b94b' },
  { label: 'Outros', value: 6, color: '#a7b0bf' },
]

export const defaultRiskEvolutionSeries = [5, 18, 28, 45, 62, 78, 82, 64, 42, 22, 10, 6]
export const defaultRiskEvolutionPeak = { time: '14:15', value: 82 }

export const defaultSimulationTimeLabels = [
  '00:00 (D0)', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00',
  '14:00', '16:00', '18:00', '20:00', '22:00', '24:00 (D1)',
]

export const defaultAbsorptionLimit = [
  2600, 2550, 2500, 2600, 2800, 3000, 3100,
  3150, 3120, 3050, 2900, 2750, 2650,
]

export const defaultTotalGeneration = [
  1800, 1650, 1600, 2100, 2900, 3350, 3470,
  3400, 3250, 2950, 2600, 2200, 1900,
]

export const defaultCurtailmentPeak = { label: 'Corte Previsto', value: 320, unit: 'MW' }

export const defaultSimulationOutput = {
  title: 'SAÍDA DA SIMULAÇÃO — PREVISÃO DE CORTE DE GERAÇÃO (MW)',
  subtitle: 'Curvas de Equilíbrio Operacional do SIN',
  yMax: 4000,
  timeLabels: defaultSimulationTimeLabels,
  absorptionLimit: defaultAbsorptionLimit,
  totalGeneration: defaultTotalGeneration,
  peak: defaultCurtailmentPeak,
}

export const normalizeSimulationOutput = (source) => {
  const src = source && typeof source === 'object' ? source : {}

  const timeLabels = Array.isArray(src.timeLabels) && src.timeLabels.length
    ? src.timeLabels.map((label) => String(label))
    : defaultSimulationTimeLabels

  const len = timeLabels.length

  const toSeries = (value, fallback) => {
    const arr = Array.isArray(value) && value.length ? value : fallback
    return Array.from({ length: len }, (_, i) => parseNumber(arr[i] ?? arr[arr.length - 1], 0))
  }

  const absorptionLimit = toSeries(src.absorptionLimit ?? src.limit, defaultAbsorptionLimit)
  const totalGeneration = toSeries(src.totalGeneration ?? src.generation, defaultTotalGeneration)

  const curtailment = totalGeneration.map((gen, i) => Math.max(0, gen - absorptionLimit[i]))

  const peakSrc = src.peak && typeof src.peak === 'object' ? src.peak : {}
  const derivedPeak = curtailment.length ? Math.max(...curtailment) : 0
  const peak = {
    label: String(peakSrc.label ?? defaultCurtailmentPeak.label),
    value: parseNumber(peakSrc.value ?? derivedPeak, defaultCurtailmentPeak.value),
    unit: String(peakSrc.unit ?? defaultCurtailmentPeak.unit),
  }
  const peakIndex = curtailment.indexOf(Math.max(...curtailment))

  return {
    title: String(src.title ?? defaultSimulationOutput.title),
    subtitle: String(src.subtitle ?? defaultSimulationOutput.subtitle),
    yMax: parseNumber(src.yMax, defaultSimulationOutput.yMax),
    timeLabels,
    absorptionLimit,
    totalGeneration,
    curtailment,
    peak,
    peakIndex: peakIndex >= 0 ? peakIndex : 0,
  }
}

export const defaultCriticalPoint = {
  name: 'NE — Sobradinho',
  severity: 'Critical',
  curtailmentProb: 78,
  volumeAtRisk: 320,
  affectedAssets: 12,
  coordinates: [-40.5, -9.41],
}

export const defaultTransmissionLine = 'Sobradinho → Juazeiro 500kV'

export const riskZoneColors = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#38bdf8',
  DEFAULT: '#94a3b8',
}

export const ufToStateName = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso',
  PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima',
  RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo',
  TO: 'Tocantins',
}

export const mmgdLevelColors = {
  LOW: '#64748b',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
}

export const mmgdLevelLabels = {
  LOW: 'Baixa Geração MMGD',
  MEDIUM: 'Média Geração MMGD',
  HIGH: 'Alta Geração MMGD',
}

export const defaultMmgdLevels = {
  AL: 'HIGH', PE: 'HIGH',
  BA: 'HIGH', SE: 'HIGH',
  CE: 'MEDIUM',
  MA: 'MEDIUM',
  PB: 'MEDIUM', RN: 'MEDIUM',
  PI: 'MEDIUM',
}

const buildHourlyMmgdCurve = (scale) => {
  const shape = [
    0, 0, 0, 0, 0, 0.02, 0.08, 0.20, 0.38, 0.58, 0.76, 0.90,
    1.0, 0.98, 0.88, 0.72, 0.52, 0.32, 0.16, 0.06, 0.01, 0, 0, 0,
  ]
  return shape.map((factor) => Math.round(factor * scale))
}

export const defaultMmgdGroups = [
  { id: 'AL_PE', label: 'AL_PE', name: 'Alagoas, Pernambuco', ufs: ['AL', 'PE'], level: 'HIGH', peak: 620 },
  { id: 'BA_SE', label: 'BA_SE', name: 'Bahia, Sergipe', ufs: ['BA', 'SE'], level: 'HIGH', peak: 580 },
  { id: 'CE', label: 'CE', name: 'Ceará', ufs: ['CE'], level: 'MEDIUM', peak: 410 },
  { id: 'MA', label: 'MA', name: 'Maranhão', ufs: ['MA'], level: 'MEDIUM', peak: 320 },
  { id: 'PB_RN', label: 'PB_RN', name: 'Paraíba, Rio Grande do Norte', ufs: ['PB', 'RN'], level: 'MEDIUM', peak: 460 },
  { id: 'PI', label: 'PI', name: 'Piauí', ufs: ['PI'], level: 'MEDIUM', peak: 380 },
].map((group) => ({ ...group, hourly: buildHourlyMmgdCurve(group.peak) }))

export const mmgdHourLabels = Array.from({ length: 24 }, (_, i) => `t+${i + 1}`)

export const normalizeMmgdGroups = (source) => {
  const list = Array.isArray(source) && source.length ? source : defaultMmgdGroups

  return list
    .map((group, index) => {
      if (!group || typeof group !== 'object') return null

      const level = String(group.level ?? 'MEDIUM').toUpperCase()
      const rawHourly = Array.isArray(group.hourly) ? group.hourly : null
      const peak = parseNumber(group.peak ?? (rawHourly ? Math.max(...rawHourly) : 0), 0)
      const hourly = rawHourly
        ? Array.from({ length: 24 }, (_, i) => parseNumber(rawHourly[i], 0))
        : buildHourlyMmgdCurve(peak || 300)

      return {
        id: String(group.id ?? group.label ?? `mmgd-group-${index}`),
        label: String(group.label ?? group.id ?? `Grupo ${index + 1}`),
        name: String(group.name ?? group.label ?? ''),
        ufs: Array.isArray(group.ufs) ? group.ufs.map((uf) => String(uf).toUpperCase()) : [],
        level,
        levelLabel: mmgdLevelLabels[level] || level,
        color: group.color || mmgdLevelColors[level] || mmgdLevelColors.MEDIUM,
        peak: peak || (hourly.length ? Math.max(...hourly) : 0),
        hourly,
      }
    })
    .filter(Boolean)
}

export const mmgdLevelsFromGroups = (groups) => {
  const levels = {}
  for (const group of groups || []) {
    for (const uf of group.ufs || []) {
      levels[String(uf).toUpperCase()] = group.level
    }
  }
  return levels
}

export const defaultMmgdZones = [
  {
    id: 'mmgd-ma', uf: 'MA', label: 'MA', level: 'MEDIUM',
    polygon: [[-46.2, -5.2], [-43.0, -3.4], [-42.4, -6.4], [-43.6, -9.4], [-46.6, -8.6]],
  },
  {
    id: 'mmgd-pi', uf: 'PI', label: 'PI', level: 'MEDIUM',
    polygon: [[-43.4, -6.2], [-41.2, -6.0], [-40.6, -9.2], [-43.2, -9.6]],
  },
  {
    id: 'mmgd-ce', uf: 'CE', label: 'CE', level: 'MEDIUM',
    polygon: [[-41.0, -3.8], [-38.4, -3.0], [-37.8, -6.4], [-40.6, -6.8]],
  },
  {
    id: 'mmgd-rn', uf: 'RN', label: 'RN', level: 'MEDIUM',
    polygon: [[-38.6, -4.8], [-36.4, -5.0], [-36.8, -6.4], [-38.8, -6.2]],
  },
  {
    id: 'mmgd-pb', uf: 'PB', label: 'PB', level: 'MEDIUM',
    polygon: [[-38.7, -6.3], [-36.5, -6.5], [-36.9, -7.9], [-38.9, -7.7]],
  },
  {
    id: 'mmgd-go', uf: 'GO', label: 'GO', level: 'MEDIUM',
    polygon: [[-50.8, -13.0], [-48.0, -12.6], [-47.4, -17.2], [-51.2, -16.8]],
  },
  {
    id: 'mmgd-ba-pe', uf: 'BA', label: 'BA', level: 'HIGH',
    polygon: [[-44.0, -9.0], [-40.4, -8.2], [-38.6, -10.6], [-39.6, -15.2], [-44.4, -14.4]],
  },
  {
    id: 'mmgd-pe', uf: 'PE', label: 'PE', level: 'HIGH',
    polygon: [[-40.6, -7.6], [-37.0, -7.4], [-35.2, -8.6], [-38.4, -9.4], [-40.8, -9.0]],
  },
]

export const defaultRiskZones = [
  {
    id: 'ne-sobradinho',
    label: 'Zona Crítica NE — Sobradinho',
    level: 'HIGH',
    curtailmentProb: 78,
    polygon: [
      [-41.6, -8.4],
      [-39.6, -8.2],
      [-38.9, -9.6],
      [-40.1, -10.9],
      [-41.9, -10.2],
    ],
  },
  {
    id: 'oeste-ba',
    label: 'Oeste BA — Atenção',
    level: 'MEDIUM',
    curtailmentProb: 45,
    polygon: [
      [-43.4, -10.6],
      [-42.0, -10.8],
      [-42.2, -12.4],
      [-43.6, -12.2],
    ],
  },
  {
    id: 'litoral-ce',
    label: 'Litoral CE — Baixo risco',
    level: 'LOW',
    curtailmentProb: 18,
    polygon: [
      [-39.4, -5.6],
      [-37.8, -5.4],
      [-38.0, -6.8],
      [-39.6, -6.6],
    ],
  },
]

const buildHourlyCurtailmentCurve = (peak) => {
  const shape = [
    0, 0, 0, 0, 0, 0, 0, 0.05, 0.15, 0.30, 0.55, 0.78,
    1.0, 0.95, 0.82, 0.60, 0.38, 0.18, 0.06, 0, 0, 0, 0, 0,
  ]
  return shape.map((factor) => Math.round(factor * peak))
}

export const defaultWindAssetForecast = [
  { id: 'cacamari', name: 'Parque Eólico Caçamari', uf: 'BA', coordinates: [-41.0, -11.2], volume: 180, probability: 78 },
  { id: 'sertao', name: 'Parque Eólico Sertão', uf: 'PE', coordinates: [-38.3, -8.4], volume: 150, probability: 69 },
  { id: 'acu', name: 'Parque Eólico Açu', uf: 'RN', coordinates: [-36.9, -5.6], volume: 120, probability: 58 },
].map((asset) => ({ ...asset, hourly: buildHourlyCurtailmentCurve(asset.volume) }))

export const normalizeWindAssetForecast = (source) => {
  const list = Array.isArray(source) && source.length ? source : defaultWindAssetForecast

  return list
    .map((asset, index) => {
      if (!asset || typeof asset !== 'object') return null
      const volume = parseNumber(asset.volume ?? asset.mw ?? asset.constrainedOff, 0)
      const rawHourly = Array.isArray(asset.hourly) ? asset.hourly : null
      const hourly = rawHourly
        ? Array.from({ length: 24 }, (_, i) => parseNumber(rawHourly[i], 0))
        : buildHourlyCurtailmentCurve(volume || 100)

      return {
        id: String(asset.id ?? asset.name ?? `asset-${index}`),
        name: String(asset.name ?? asset.label ?? `Usina ${index + 1}`),
        uf: asset.uf ? String(asset.uf).toUpperCase() : null,
        coordinates: parseCoordinates(asset.coordinates ?? asset.coords, null),
        volume,
        probability: parseNumber(asset.probability ?? asset.prob, 0),
        hourly,
      }
    })
    .filter(Boolean)
    .slice(0, 3)
}

export const defaultMitigation = {
  action: 'Activate 180 MW of BESS between 13:30 and 16:45',
  curtailmentWithout: 320,
  curtailmentAfter: 95,
  energyRecovered: 225,
  coverage: 82,
  resourcesRequired: 'BESS + Flexible Load (Sobradinho 500kV)',
}

export const defaultKpis = {
  volumeEolico: 320,
  volumeEolicoUnidade: 'MWméd',
  volumeEolicoMwh: 1440,
  minutosRestritos: 45,
  duracaoContinua: '3h 15min',
  janelaCritica: '13:30 - 16:45',
  volumeMMGD: 1500,
}

export const defaultStorage = {
  subestacao: 'Nordeste (NE) • Subestação Sobradinho 500kV',
  regiaoTag: 'Nordeste (NE)',
  disponibilidade: 'DISPONÍVEL P/ ABSORÇÃO',
  capacidadeTotal: 450,
  nivelCarga: 48,
  cargaAtual: 216,
  absorcao: 108,
  margem: 28,
  alocacaoPotencial: 72,
  volumeEsperadoAbsorcao: 108,
  volumeEsperadoLabel: '108 MWméd',
  valorRecuperado: 142800.0,
  proximaRecarga: '16:00h - 18:00h (Próximo Dia)',
  cRate: '0.5C (90 MW) • 1.8 ciclos/dia',
  prontidaoVpp: '100% Sincronizado',
}

export const defaultAssetsByState = {
  BA: {
    regiao: 'Bahia', curtailmentValue: 78, criticalWindow: '13:30 - 16:45',
    kpis: { volumeEolico: 320, minutosRestritos: 45, duracaoContinua: '3h 15min', janelaCritica: '13:30 - 16:45', volumeMMGD: 1500 },
    storage: { regiaoTag: 'Bahia (BA)', subestacao: 'Bahia (BA) • Subestação Sobradinho 500kV', nivelCarga: 48, cargaAtual: 216, absorcao: 108, margem: 24, capacidadeTotal: 450, valorRecuperado: 142800, proximaRecarga: '16:00h - 18:00h (Próximo Dia)' },
  },
  PI: {
    regiao: 'Piauí', curtailmentValue: 52, criticalWindow: '11:00 - 14:00',
    kpis: { volumeEolico: 180, minutosRestritos: 28, duracaoContinua: '2h 05min', janelaCritica: '11:00 - 14:00', volumeMMGD: 940 },
    storage: { regiaoTag: 'Piauí (PI)', subestacao: 'Piauí (PI) • Subestação Teresina', nivelCarga: 63, cargaAtual: 284, absorcao: 72, margem: 18, capacidadeTotal: 450, valorRecuperado: 88400, proximaRecarga: '15:00h - 17:00h (Próximo Dia)' },
  },
  CE: {
    regiao: 'Ceará', curtailmentValue: 41, criticalWindow: '12:00 - 15:30',
    kpis: { volumeEolico: 210, minutosRestritos: 22, duracaoContinua: '1h 40min', janelaCritica: '12:00 - 15:30', volumeMMGD: 1120 },
    storage: { regiaoTag: 'Ceará (CE)', subestacao: 'Ceará (CE) • Subestação Fortaleza', nivelCarga: 55, cargaAtual: 248, absorcao: 96, margem: 22, capacidadeTotal: 450, valorRecuperado: 101300, proximaRecarga: '16:30h - 18:30h (Próximo Dia)' },
  },
  PE: {
    regiao: 'Pernambuco', curtailmentValue: 69, criticalWindow: '13:00 - 16:00',
    kpis: { volumeEolico: 260, minutosRestritos: 38, duracaoContinua: '2h 50min', janelaCritica: '13:00 - 16:00', volumeMMGD: 1310 },
    storage: { regiaoTag: 'Pernambuco (PE)', subestacao: 'Pernambuco (PE) • Subestação Luiz Gonzaga', nivelCarga: 41, cargaAtual: 185, absorcao: 124, margem: 26, capacidadeTotal: 450, valorRecuperado: 128700, proximaRecarga: '16:00h - 18:00h (Próximo Dia)' },
  },
  MA: {
    regiao: 'Maranhão', curtailmentValue: 34, criticalWindow: '10:30 - 13:00',
    kpis: { volumeEolico: 95, minutosRestritos: 15, duracaoContinua: '1h 10min', janelaCritica: '10:30 - 13:00', volumeMMGD: 680 },
    storage: { regiaoTag: 'Maranhão (MA)', subestacao: 'Maranhão (MA) • Subestação São Luís', nivelCarga: 72, cargaAtual: 324, absorcao: 54, margem: 14, capacidadeTotal: 450, valorRecuperado: 61500, proximaRecarga: '15:30h - 17:30h (Próximo Dia)' },
  },
  RN: {
    regiao: 'Rio Grande do Norte', curtailmentValue: 58, criticalWindow: '12:30 - 15:00',
    kpis: { volumeEolico: 240, minutosRestritos: 32, duracaoContinua: '2h 20min', janelaCritica: '12:30 - 15:00', volumeMMGD: 1080 },
    storage: { regiaoTag: 'Rio Grande do Norte (RN)', subestacao: 'RN • Subestação Açu', nivelCarga: 51, cargaAtual: 230, absorcao: 98, margem: 20, capacidadeTotal: 450, valorRecuperado: 112400, proximaRecarga: '16:00h - 18:00h (Próximo Dia)' },
  },
  PB: {
    regiao: 'Paraíba', curtailmentValue: 47, criticalWindow: '11:30 - 14:30',
    kpis: { volumeEolico: 170, minutosRestritos: 24, duracaoContinua: '1h 50min', janelaCritica: '11:30 - 14:30', volumeMMGD: 860 },
    storage: { regiaoTag: 'Paraíba (PB)', subestacao: 'PB • Subestação Campina Grande', nivelCarga: 60, cargaAtual: 270, absorcao: 78, margem: 18, capacidadeTotal: 450, valorRecuperado: 92100, proximaRecarga: '15:30h - 17:30h (Próximo Dia)' },
  },
  GO: {
    regiao: 'Goiás', curtailmentValue: 29, criticalWindow: '10:00 - 12:30',
    kpis: { volumeEolico: 60, minutosRestritos: 12, duracaoContinua: '0h 55min', janelaCritica: '10:00 - 12:30', volumeMMGD: 540 },
    storage: { regiaoTag: 'Goiás (GO)', subestacao: 'GO • Subestação Serra da Mesa', nivelCarga: 78, cargaAtual: 351, absorcao: 42, margem: 12, capacidadeTotal: 450, valorRecuperado: 48700, proximaRecarga: '14:30h - 16:30h (Próximo Dia)' },
  },
}

export const applyStateData = (base, uf, assetsByState) => {
  const map = assetsByState || {}
  const st = map[String(uf || '').toUpperCase()]
  if (!st) return base

  return {
    ...base,
    regiao: st.regiao ?? base.regiao,
    uf: String(uf).toUpperCase(),
    curtailmentValue: parseNumber(st.curtailmentValue, base.curtailmentValue),
    criticalWindow: st.criticalWindow ?? base.criticalWindow,
    kpis: { ...base.kpis, ...(st.kpis || {}) },
    storage: { ...base.storage, ...(st.storage || {}) },
  }
}

export const parseNumber = (value, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export const parseCoordinates = (value, fallback = [-41.83, -9.45]) => {
  if (Array.isArray(value) && value.length >= 2) {
    const lon = Number(value[0])
    const lat = Number(value[1])
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      return [lon, lat]
    }
  }

  if (value && typeof value === 'object') {
    const lon = Number(value.lon ?? value.lng ?? value.longitude ?? value.x)
    const lat = Number(value.lat ?? value.latitude ?? value.y)
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      return [lon, lat]
    }
  }

  if (typeof value === 'string' && value.includes(',')) {
    const [lon, lat] = value.split(',').map((item) => Number(item.trim()))
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      return [lon, lat]
    }
  }

  return fallback
}

export const normalizeRiskPoints = (source) => {
  if (!Array.isArray(source) || source.length === 0) return defaultRiskPoints

  return source.map((point) => ({
    label: point?.label || point?.name || 'Risk',
    value: `${point?.value ?? point?.probability ?? 0}%`,
    color: point?.color || '#38bdf8',
  }))
}

export const normalizeRiskZones = (source) => {
  if (!Array.isArray(source) || source.length === 0) return defaultRiskZones

  const zones = source
    .map((zone, index) => {
      if (!zone || typeof zone !== 'object') return null

      const rawPolygon = zone.polygon ?? zone.coordinates ?? zone.coords ?? zone.points
      if (!Array.isArray(rawPolygon) || rawPolygon.length < 3) return null

      const polygon = rawPolygon
        .map((pt) => parseCoordinates(pt, null))
        .filter((pt) => Array.isArray(pt))

      if (polygon.length < 3) return null

      const level = String(zone.level ?? zone.severity ?? 'DEFAULT').toUpperCase()

      return {
        id: String(zone.id ?? zone.key ?? `zone-${index}`),
        label: String(zone.label ?? zone.name ?? `Zone ${index + 1}`),
        level,
        curtailmentProb: parseNumber(zone.curtailmentProb ?? zone.probability ?? zone.value, 0),
        color: zone.color || riskZoneColors[level] || riskZoneColors.DEFAULT,
        polygon,
      }
    })
    .filter(Boolean)

  return zones.length ? zones : defaultRiskZones
}

export const normalizeMmgdZones = (source) => {
  const list = Array.isArray(source) && source.length ? source : defaultMmgdZones

  const zones = list
    .map((zone, index) => {
      if (!zone || typeof zone !== 'object') return null

      const rawPolygon = zone.polygon ?? zone.coordinates ?? zone.coords ?? zone.points
      if (!Array.isArray(rawPolygon) || rawPolygon.length < 3) return null

      const polygon = rawPolygon.map((pt) => parseCoordinates(pt, null)).filter((pt) => Array.isArray(pt))
      if (polygon.length < 3) return null

      const level = String(zone.level ?? 'MEDIUM').toUpperCase()

      return {
        id: String(zone.id ?? zone.key ?? `mmgd-${index}`),
        uf: zone.uf ? String(zone.uf).toUpperCase() : null,
        label: String(zone.label ?? zone.name ?? zone.uf ?? `Zona ${index + 1}`),
        level,
        levelLabel: mmgdLevelLabels[level] || level,
        color: zone.color || mmgdLevelColors[level] || mmgdLevelColors.MEDIUM,
        polygon,
      }
    })
    .filter(Boolean)

  return zones.length ? zones : defaultMmgdZones
}

export const normalizeResources = (source) => {
  const resourceList = Array.isArray(source) ? source : source ? Object.values(source).flat() : defaultMapResources

  if (!Array.isArray(resourceList) || resourceList.length === 0) {
    return defaultMapResources
  }

  return resourceList
    .map((resource) => {
      if (!resource || typeof resource !== 'object') return null

      const type = String(resource.type || resource.kind || resource.category || 'DEFAULT').toUpperCase()
      const coordinates = parseCoordinates(
        resource.coordinates ?? resource.coords ?? resource.position ?? resource.point ?? resource.location
      )

      if (!coordinates) return null

      return {
        ...resource,
        type,
        name: resource.name || resource.label || resource.asset || type,
        quantity: parseNumber(resource.quantity ?? resource.capacity ?? resource.mw ?? resource.amount ?? 1, 1),
        coordinates,
        color: resource.color || undefined,
      }
    })
    .filter(Boolean)
}

const coordDistance = (a, b) => {
  if (!a || !b) return Infinity
  const dLon = a[0] - b[0]
  const dLat = a[1] - b[1]
  return Math.sqrt(dLon * dLon + dLat * dLat)
}

export const deriveCriticalPoint = (payload, mapCoordinates, resources, curtailmentValue) => {
  const explicit = payload?.criticalPoint ?? payload?.critical_point ?? payload?.riskMap?.criticalPoint

  const list = Array.isArray(resources) ? resources : []

  let nearest = null
  let nearestDist = Infinity
  for (const resource of list) {
    const dist = coordDistance(resource.coordinates, mapCoordinates)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = resource
    }
  }

  const coordinates = parseCoordinates(
    explicit?.coordinates ?? explicit?.coords ?? nearest?.coordinates ?? mapCoordinates,
    defaultCriticalPoint.coordinates
  )

  const RADIUS = 3.5
  const affectedNearby = list.filter((resource) => coordDistance(resource.coordinates, coordinates) <= RADIUS)
  const affectedFromCrossing = affectedNearby.length > 1 ? affectedNearby.length : list.length

  return {
    name: String(explicit?.name ?? nearest?.name ?? nearest?.label ?? defaultCriticalPoint.name),
    severity: String(explicit?.severity ?? defaultCriticalPoint.severity),
    curtailmentProb: parseNumber(
      explicit?.curtailmentProb ?? explicit?.probability ?? curtailmentValue,
      defaultCriticalPoint.curtailmentProb
    ),
    volumeAtRisk: parseNumber(
      explicit?.volumeAtRisk ?? explicit?.volume ?? explicit?.mw,
      defaultCriticalPoint.volumeAtRisk
    ),
    affectedAssets: parseNumber(
      explicit?.affectedAssets ?? explicit?.assets ?? affectedFromCrossing,
      defaultCriticalPoint.affectedAssets
    ),
    coordinates,
  }
}

export const normalizeTelemetryPayload = (payload = {}) => {
  const mapCoordinates = parseCoordinates(
    payload.mapCoordinates ?? payload.coordinates ?? payload.center ?? payload.map?.coordinates ?? payload.location?.coordinates,
    [-41.83, -9.45]
  )

  const curtailmentValue = parseNumber(payload.curtailmentValue ?? payload.curtailment ?? payload.curtailmentProbability, 72)
  const resources = normalizeResources(payload.resources ?? payload.riskMap?.resources ?? payload.assets)
  const criticalPoint = deriveCriticalPoint(payload, mapCoordinates, resources, curtailmentValue)

  const mit = payload.mitigation ?? payload.dispatch ?? {}
  const mitigation = {
    action: String(mit.action ?? payload.dispatchAction ?? defaultMitigation.action),
    curtailmentWithout: parseNumber(mit.curtailmentWithout ?? mit.without, defaultMitigation.curtailmentWithout),
    curtailmentAfter: parseNumber(mit.curtailmentAfter ?? mit.after, defaultMitigation.curtailmentAfter),
    energyRecovered: parseNumber(mit.energyRecovered ?? mit.recovered, defaultMitigation.energyRecovered),
    coverage: parseNumber(mit.coverage, defaultMitigation.coverage),
    resourcesRequired: String(mit.resourcesRequired ?? mit.resources ?? defaultMitigation.resourcesRequired),
  }

  const k = payload.kpis ?? {}
  const volumeEolico = parseNumber(k.volumeEolico ?? payload.volumeEolico ?? payload.windConstrained, defaultKpis.volumeEolico)
  const kpis = {
    volumeEolico,
    volumeEolicoUnidade: String(k.volumeEolicoUnidade ?? payload.volumeEolicoUnidade ?? defaultKpis.volumeEolicoUnidade),
    volumeEolicoMwh: parseNumber(k.volumeEolicoMwh ?? payload.volumeEolicoMwh, defaultKpis.volumeEolicoMwh),
    minutosRestritos: parseNumber(k.minutosRestritos ?? payload.minutosRestritos ?? payload.restrictedMinutes, defaultKpis.minutosRestritos),
    duracaoContinua: String(k.duracaoContinua ?? payload.duracaoContinua ?? defaultKpis.duracaoContinua),
    janelaCritica: String(k.janelaCritica ?? payload.criticalWindow ?? payload.critical_window ?? defaultKpis.janelaCritica),
    volumeMMGD: parseNumber(k.volumeMMGD ?? payload.volumeMMGD ?? payload.mmgdTotal, defaultKpis.volumeMMGD),
  }

  const s = payload.storage ?? payload.bess ?? {}
  const nivelCarga = parseNumber(s.nivelCarga ?? s.charge ?? s.soc, defaultStorage.nivelCarga)
  const margem = parseNumber(s.margem ?? s.margin, defaultStorage.margem)
  const storage = {
    subestacao: String(s.subestacao ?? defaultStorage.subestacao),
    regiaoTag: String(s.regiaoTag ?? payload.regiao ?? defaultStorage.regiaoTag),
    disponibilidade: String(s.disponibilidade ?? defaultStorage.disponibilidade),
    capacidadeTotal: parseNumber(s.capacidadeTotal ?? s.capacity, defaultStorage.capacidadeTotal),
    nivelCarga,
    cargaAtual: parseNumber(s.cargaAtual ?? s.currentMwh, defaultStorage.cargaAtual),
    absorcao: parseNumber(s.absorcao ?? s.absorption, defaultStorage.absorcao),
    margem,
    alocacaoPotencial: parseNumber(s.alocacaoPotencial ?? s.allocation, Math.min(100, nivelCarga + margem)),
    volumeEsperadoAbsorcao: parseNumber(s.volumeEsperadoAbsorcao, defaultStorage.volumeEsperadoAbsorcao),
    volumeEsperadoLabel: String(s.volumeEsperadoLabel ?? `${parseNumber(s.volumeEsperadoAbsorcao, defaultStorage.volumeEsperadoAbsorcao)} MWméd`),
    valorRecuperado: parseNumber(s.valorRecuperado ?? s.recoveredValue, defaultStorage.valorRecuperado),
    proximaRecarga: String(s.proximaRecarga ?? defaultStorage.proximaRecarga),
    cRate: String(s.cRate ?? defaultStorage.cRate),
    prontidaoVpp: String(s.prontidaoVpp ?? defaultStorage.prontidaoVpp),
  }

  const assetsByState = payload.assetsByState ? { ...defaultAssetsByState, ...payload.assetsByState } : defaultAssetsByState

  const mmgdGroups = normalizeMmgdGroups(payload.mmgdGroups ?? payload.mmgd?.groups)
  const windAssetForecast = normalizeWindAssetForecast(payload.windAssetForecast ?? payload.assetForecast ?? payload.windAssets)
  const mmgdLevels = payload.mmgdLevels
    ? { ...defaultMmgdLevels, ...payload.mmgdLevels }
    : { ...defaultMmgdLevels, ...mmgdLevelsFromGroups(mmgdGroups) }

  return {
    kpis,
    storage,
    mmgdLevels,
    mmgdGroups,
    mmgdHourLabels,
    windAssetForecast,
    assetsByState,
    regiao: payload.regiao || payload.region || payload.area || 'Northeast',
    uf: payload.uf || payload.submarket || payload.state || 'NE',
    horizonte: payload.horizonte || payload.horizon || 'D0 + D1',
    curtailmentValue,
    transmissionLine: String(payload.transmissionLine ?? payload.criticalPoint?.transmissionLine ?? defaultTransmissionLine),
    mitigation,
    p10: parseNumber(payload.p10, 40),
    p50: parseNumber(payload.p50, 58),
    p90: parseNumber(payload.p90, 81),
    energyRiskValue: parseNumber(payload.energyRiskValue ?? payload.energyAtRisk ?? payload.energyRisk ?? 216, 216),
    energyRiskMwh: parseNumber(payload.energyRiskMwh ?? payload.energySpill ?? payload.energySpillMwh ?? 154, 154),
    criticalWindow: payload.criticalWindow || payload.critical_window || '12:00 - 18:00',
    mapCoordinates,
    criticalPoint,
    riskPoints: normalizeRiskPoints(payload.points ?? payload.riskPoints ?? payload.riskMap?.points),
    riskZones: normalizeRiskZones(payload.riskZones ?? payload.zones ?? payload.riskMap?.zones),
    resources,
    causeRows: Array.isArray(payload.causeRows)
      ? payload.causeRows.map((row) => ({
          label: row.label || row.name || 'Cause',
          value: parseNumber(row.value, 0),
          color: row.color || '#38bdf8',
        }))
      : defaultCauseRows,
    riskEvolutionSeries: Array.isArray(payload.riskEvolutionSeries)
      ? payload.riskEvolutionSeries.map((value) => parseNumber(value, 0))
      : defaultRiskEvolutionSeries,
    riskEvolutionPeak: payload.riskEvolutionPeak || payload.peak || defaultRiskEvolutionPeak,
    simulationOutput: normalizeSimulationOutput(payload.simulationOutput ?? payload.simulation ?? payload.curtailmentForecast),
  }
}
