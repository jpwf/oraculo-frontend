// Funcoes puras de normalizacao de telemetria.
// Sem hooks / sem React: podem rodar na main thread OU dentro de um Web Worker.

export const defaultRiskPoints = [
  { label: 'High Risk', value: '78%', color: '#ef4444' },
  { label: 'Medium Risk', value: '42%', color: '#f59e0b' },
  { label: 'Low Risk', value: '18%', color: '#38bdf8' },
]

export const defaultMapResources = [
  // Coordenadas escolhidas para cair DENTRO do estado indicado (conferido via
  // point-in-polygon contra o GeoJSON dos estados).
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

// Zonas de risco desenhadas SOBRE o mapa (poligonos georreferenciados,
// equivalentes a um "shapefile" de areas). Cada zona: lista de [lon, lat],
// um nivel de severidade e um rotulo. Cores default por nivel abaixo.
export const riskZoneColors = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#38bdf8',
  DEFAULT: '#94a3b8',
}

// UF -> nome do estado (chave usada pelo GeoJSON `brazil-states.json`).
export const ufToStateName = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso',
  PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima',
  RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo',
  TO: 'Tocantins',
}

// Cores por nivel de geracao MMGD (foto: Baixa/Media/Alta).
export const mmgdLevelColors = {
  LOW: '#64748b',    // Baixa Geracao (contorno claro)
  MEDIUM: '#f59e0b', // Media Geracao (ambar)
  HIGH: '#ef4444',   // Alta Geracao (vermelho)
}

export const mmgdLevelLabels = {
  LOW: 'Baixa Geração MMGD',
  MEDIUM: 'Média Geração MMGD',
  HIGH: 'Alta Geração MMGD',
}

// Nivel de geracao MMGD por UF (default; alimentavel por request).
export const defaultMmgdLevels = {
  MA: 'MEDIUM',
  PI: 'MEDIUM',
  CE: 'MEDIUM',
  RN: 'MEDIUM',
  PB: 'MEDIUM',
  GO: 'MEDIUM',
  BA: 'HIGH',
  PE: 'HIGH',
  SE: 'HIGH',
  AL: 'HIGH',
}

// Zonas MMGD desenhadas como POLIGONOS sobre o mapa (modo Geracao MMGD),
// coloridas por nivel de geracao (Baixa/Media/Alta). Alimentavel por request.
// Zonas MMGD focadas apenas no NORDESTE (poligonos por nivel de geracao).
// Poligonos MMGD por regiao (estilo foto): ambar = Media, vermelho = Alta.
// Cada zona tem `uf` (usada no clique para atualizar os dados) e `label` (rotulo).
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

// Bloco "Recommended ISO dispatch action".
export const defaultMitigation = {
  action: 'Activate 180 MW of BESS between 13:30 and 16:45',
  curtailmentWithout: 320,
  curtailmentAfter: 95,
  energyRecovered: 225,
  coverage: 82,
  resourcesRequired: 'BESS + Flexible Load (Sobradinho 500kV)',
}

// KPIs do topo (foto 1, em portugues).
export const defaultKpis = {
  // Probabilidade de Constrained Off (donut) = curtailmentValue.
  volumeEolico: 320, // Volume Eolico Constrained Off previsto (MW)
  minutosRestritos: 45, // Minutos restritos por hora operativa (min)
  duracaoContinua: '3h 15min', // duracao continua
  janelaCritica: '13:30 - 16:45',
  volumeMMGD: 1500, // Volume MMGD total previsto T+24 (MW)
}

// Painel "Estado de Armazenamento (BESS)" (fotos 1 e 2).
export const defaultStorage = {
  subestacao: 'Nordeste (NE) • Subestação Sobradinho 500kV',
  regiaoTag: 'Nordeste (NE)',
  disponibilidade: 'DISPONÍVEL P/ ABSORÇÃO',
  capacidadeTotal: 450, // MWh
  nivelCarga: 48, // % (nivel atual da bateria)
  cargaAtual: 216, // MWh
  absorcao: 108, // +MWh (potencial de absorcao/constrained off)
  margem: 28, // % de margem
  alocacaoPotencial: 72, // % (topo da faixa hachurada = nivel + margem)
  volumeEsperadoAbsorcao: 108, // MWmed
  volumeEsperadoLabel: '108 MWméd',
  valorRecuperado: 142800.0, // R$
  proximaRecarga: '16:00h - 18:00h (Próximo Dia)',
  cRate: '0.5C (90 MW) • 1.8 ciclos/dia',
  prontidaoVpp: '100% Sincronizado',
}

// Dados POR ESTADO (UF). Ao clicar num ativo no mapa MMGD, os KPIs/BESS
// exibidos passam a ser os do estado do ativo. Ativos no mesmo estado
// compartilham os mesmos dados. Alimentavel por request (payload.assetsByState).
// Cada entrada sobrescreve campos de kpis/storage/curtailment/criticalWindow.
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

// Aplica os overrides do estado sobre o objeto normalizado base.
// Retorna um novo objeto normalizado com kpis/storage/curtailment do estado.
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

// Normaliza zonas de risco (poligonos) vindas do payload; cai nos defaults
// se nao houver zonas validas. Cada poligono e uma lista de [lon, lat].
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

// Normaliza as zonas MMGD (poligonos por nivel de geracao) vindas do payload;
// cai nos defaults se nada valido. Resolve cor e rotulo por nivel.
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

  // KPIs do topo (foto 1) — alimentados pelo payload, com defaults.
  const k = payload.kpis ?? {}
  const kpis = {
    volumeEolico: parseNumber(k.volumeEolico ?? payload.volumeEolico ?? payload.windConstrained, defaultKpis.volumeEolico),
    minutosRestritos: parseNumber(k.minutosRestritos ?? payload.minutosRestritos ?? payload.restrictedMinutes, defaultKpis.minutosRestritos),
    duracaoContinua: String(k.duracaoContinua ?? payload.duracaoContinua ?? defaultKpis.duracaoContinua),
    janelaCritica: String(k.janelaCritica ?? payload.criticalWindow ?? payload.critical_window ?? defaultKpis.janelaCritica),
    volumeMMGD: parseNumber(k.volumeMMGD ?? payload.volumeMMGD ?? payload.mmgdTotal, defaultKpis.volumeMMGD),
  }

  // Painel BESS (fotos 1 e 2) — alimentado pelo payload, com defaults.
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

  return {
    kpis,
    storage,
    mmgdLevels: { ...defaultMmgdLevels, ...(payload.mmgdLevels || {}) },
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
  }
}
