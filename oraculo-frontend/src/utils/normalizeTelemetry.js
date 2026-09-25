// Funcoes puras de normalizacao de telemetria.
// Sem hooks / sem React: podem rodar na main thread OU dentro de um Web Worker.

export const defaultRiskPoints = [
  { label: 'High Risk', value: '78%', color: '#ef4444' },
  { label: 'Medium Risk', value: '42%', color: '#f59e0b' },
  { label: 'Low Risk', value: '18%', color: '#38bdf8' },
]

export const defaultMapResources = [
  { type: 'WIND', name: 'Wind Farm 1', quantity: 180, coordinates: [-41.0, -10.8], color: '#38bdf8' },
  { type: 'WIND', name: 'Wind Farm 2', quantity: 150, coordinates: [-38.8, -9.2], color: '#38bdf8' },
  { type: 'SOLAR_PLANT', name: 'Solar Plant 1', quantity: 210, coordinates: [-42.8, -7.6], color: '#f59e0b' },
  { type: 'SOLAR_PLANT', name: 'Solar Plant 2', quantity: 140, coordinates: [-39.4, -6.4], color: '#f59e0b' },
  { type: 'MMGD', name: 'MMGD 1', quantity: 95, coordinates: [-43.2, -11.6], color: '#34d399' },
  { type: 'BESS', name: 'BESS 1', quantity: 120, coordinates: [-40.2, -8.2], color: '#a78bfa' },
]

export const defaultCauseRows = [
  { label: 'Transmission', value: 58, color: '#ff5a5a' },
  { label: 'Electrical', value: 24, color: '#4ecae6' },
  { label: 'Energy', value: 12, color: '#f5b94b' },
  { label: 'Other', value: 6, color: '#a7b0bf' },
]

export const defaultRiskEvolutionSeries = [5, 18, 28, 45, 62, 78, 82, 64, 42, 22, 10, 6]
export const defaultRiskEvolutionPeak = { time: '14:15', value: 82 }

export const defaultCriticalPoint = {
  name: 'NE — Sobradinho',
  severity: 'Critical',
  curtailmentProb: 78,
  volumeAtRisk: 320,
  affectedAssets: 12,
  coordinates: [-40.5, -9.41],
}

// Linha de transmissao exibida no card "Highest-Risk Node".
export const defaultTransmissionLine = 'Sobradinho → Juazeiro 500kV'

// Bloco "Recommended ISO dispatch action".
export const defaultMitigation = {
  action: 'Activate 180 MW of BESS between 13:30 and 16:45',
  curtailmentWithout: 320,
  curtailmentAfter: 95,
  energyRecovered: 225,
  coverage: 82,
  resourcesRequired: 'BESS + Flexible Load (Sobradinho 500kV)',
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
        // Preserva a cor propria; se nao houver, o RiskMap resolve pela cor do tipo.
        color: resource.color || undefined,
      }
    })
    .filter(Boolean)
}

// Distancia euclidiana simples entre dois pares [lon, lat].
const coordDistance = (a, b) => {
  if (!a || !b) return Infinity
  const dLon = a[0] - b[0]
  const dLat = a[1] - b[1]
  return Math.sqrt(dLon * dLon + dLat * dLat)
}

// Deriva o ponto critico a partir do CRUZAMENTO de coordenadas:
// o recurso (wind farm, solar plant, etc.) mais proximo do centro de risco
// do mapa define o ponto; os assets "afetados" sao os que caem dentro de um raio.
// Os valores (prob, volume, assets) vem do payload/curtailment quando existirem,
// senao caem para os defaults.
export const deriveCriticalPoint = (payload, mapCoordinates, resources, curtailmentValue) => {
  const explicit = payload?.criticalPoint ?? payload?.critical_point ?? payload?.riskMap?.criticalPoint

  const list = Array.isArray(resources) ? resources : []

  // Cruzamento: recurso mais proximo do centro de risco (mapCoordinates).
  let nearest = null
  let nearestDist = Infinity
  for (const resource of list) {
    const dist = coordDistance(resource.coordinates, mapCoordinates)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = resource
    }
  }

  // Coordenada do ponto critico: a explicita > o cruzamento > o proprio centro.
  const coordinates = parseCoordinates(
    explicit?.coordinates ?? explicit?.coords ?? nearest?.coordinates ?? mapCoordinates,
    defaultCriticalPoint.coordinates
  )

  // Assets afetados: recursos dentro de um raio do ponto critico (cluster de risco).
  // ~3.5 graus cobre o cluster do submercado; se pegar poucos, usa o total.
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

  return {
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
  }
}
