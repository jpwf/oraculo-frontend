import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { mmgdLevelColors, ufToStateName } from '../utils/normalizeTelemetry';

// nome do estado (GeoJSON) -> UF, para o clique no geo.
const stateNameToUf = Object.fromEntries(
  Object.entries(ufToStateName).map(([uf, name]) => [name, uf])
);

// Ray-casting: ponto [lon,lat] dentro de um anel de vertices.
const pointInRing = (point, ring) => {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const pointInGeometry = (point, geometry) => {
  if (!geometry) return false;
  if (geometry.type === 'Polygon') return pointInRing(point, geometry.coordinates[0]);
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.some((poly) => pointInRing(point, poly[0]));
  return false;
};
// UF (sigla) do estado do GeoJSON que contem a coordenada.
const ufFromCoord = (point, features) => {
  if (!point || !Array.isArray(features)) return null;
  for (const feature of features) {
    if (pointInGeometry(point, feature.geometry)) return feature.properties?.sigla || null;
  }
  return null;
};

const resourceColors = {
  WIND: '#38bdf8',
  SOLAR: '#f59e0b',
  SOLAR_FARM: '#f59e0b',
  SOLAR_PLANT: '#f59e0b',
  MMGD: '#34d399',
  BESS: '#a78bfa',
  DEFAULT: '#f8fafc',
};

const resourceIcons = {
  WIND: 'triangle',
  SOLAR: 'rect',
  SOLAR_FARM: 'rect',
  SOLAR_PLANT: 'rect',
  MMGD: 'diamond',
  BESS: 'roundRect',
  DEFAULT: 'circle',
};

// Rotulo generico por tipo para a legenda (nao o nome de um recurso especifico).
const resourceTypeLabels = {
  WIND: 'Wind',
  SOLAR: 'Solar',
  SOLAR_FARM: 'Solar',
  SOLAR_PLANT: 'Solar',
  MMGD: 'MMGD',
  BESS: 'BESS',
  DEFAULT: 'Resource',
};

// Funcoes puras em escopo de modulo: nao dependem de props/state,
// nao sao recriadas a cada render (evita dependencia instavel no useMemo).
const normalizeCoordinates = (value) => {
  if (Array.isArray(value) && value.length >= 2) {
    return [Number(value[0]), Number(value[1])];
  }

  if (value && typeof value === 'object') {
    const lon = Number(value.lon ?? value.lng ?? value.longitude ?? value.x);
    const lat = Number(value.lat ?? value.latitude ?? value.y);

    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      return [lon, lat];
    }
  }

  return null;
};

const normalizeResources = (source) => {
  if (!source) return [];

  if (Array.isArray(source)) {
    return source
      .map((resource) => {
        if (!resource || typeof resource !== 'object') return null;
        const type = String(resource.type || resource.kind || resource.category || 'DEFAULT').toUpperCase();
        const coordinates = normalizeCoordinates(resource.coordinates ?? resource.coords ?? resource.position ?? resource.point);

        if (!coordinates) return null;

        return {
          ...resource,
          type,
          coordinates,
          label: resource.label || resource.name || type,
          color: resource.color || resourceColors[type] || resourceColors.DEFAULT,
        };
      })
      .filter(Boolean);
  }

  return Object.entries(source)
    .flatMap(([key, value]) => {
      if (!Array.isArray(value)) return [];

      return value
        .map((resource) => {
          if (!resource || typeof resource !== 'object') {
            const coordinates = normalizeCoordinates(resource);
            if (!coordinates) return null;
            return { type: key.toUpperCase(), coordinates, label: key.toUpperCase() };
          }

          const coordinates = normalizeCoordinates(resource.coordinates ?? resource.coords ?? resource.position ?? resource.point);
          if (!coordinates) return null;

          return {
            ...resource,
            type: String(resource.type || resource.kind || resource.category || key).toUpperCase(),
            coordinates,
            label: resource.label || resource.name || String(resource.type || key).toUpperCase(),
            color: resource.color || resourceColors[String(resource.type || key).toUpperCase()] || resourceColors.DEFAULT,
          };
        })
        .filter(Boolean);
    });
};

export default function RiskMap({ coordinates, points = [], resources = [], criticalPoint = null, riskZones = [], mmgdLevels = {}, mode = 'curtailment', onSelectState = null }) {
  const mapRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const geoFeaturesRef = useRef(null);
  const tooltipRef = useRef(null);
  const criticalRef = useRef(null);

  const [loading, setLoading] = useState(true);
  // Vira true quando a instancia do ECharts esta pronta (apos carregar o GeoJSON).
  // Usado para disparar o desenho das series assim que o chart existir.
  const [chartReady, setChartReady] = useState(false);

  const resourceList = useMemo(() => normalizeResources(resources), [resources]);

  const pointRows =
    points.length > 0
      ? points
      : [
          { label: 'High Risk', value: '78%', color: '#ef4444' },
          { label: 'Medium Risk', value: '42%', color: '#f59e0b' },
          { label: 'Low Risk', value: '18%', color: '#38bdf8' },
        ];

  // Tratamento para garantir coordenadas válidas (Sobradinho / NE)
  const safeLon = Number.isFinite(coordinates?.[0]) ? coordinates[0] : -40.5;
  const safeLat = Number.isFinite(coordinates?.[1]) ? coordinates[1] : -9.41;

  // Ponto critico vem do cruzamento de coordenadas (calculado no normalizador).
  // Coordenada do ponto: a do criticalPoint, senao o proprio centro de risco.
  const critical = useMemo(() => {
    const cp = criticalPoint || {};
    const coords = normalizeCoordinates(cp.coordinates) || [safeLon, safeLat];
    return {
      name: cp.name || 'NE — Sobradinho',
      severity: cp.severity || 'Critical',
      curtailmentProb: Number.isFinite(Number(cp.curtailmentProb)) ? Number(cp.curtailmentProb) : 78,
      volumeAtRisk: Number.isFinite(Number(cp.volumeAtRisk)) ? Number(cp.volumeAtRisk) : 320,
      affectedAssets: Number.isFinite(Number(cp.affectedAssets)) ? Number(cp.affectedAssets) : 12,
      coordinates: coords,
    };
  }, [criticalPoint, safeLon, safeLat]);

  // Legenda por TIPO (rotulo generico), nao pelo nome de um recurso especifico.
  const resourceLegend = Array.from(
    new Map(
      resourceList.map((resource) => {
        const type = String(resource.type || 'DEFAULT').toUpperCase();
        return [
          type,
          {
            type,
            label: resourceTypeLabels[type] || type,
            color: resourceColors[type] || resource.color || resourceColors.DEFAULT,
          },
        ];
      })
    ).values()
  );

  // Legenda exibida: no modo MMGD inclui os niveis de geracao (Baixa/Media/Alta)
  // + os tipos de recurso; no modo curtailment mostra so os tipos.
  const legendItems = useMemo(() => {
    if (mode !== 'mmgd') return resourceLegend;
    return [
      { type: 'LVL_LOW', label: 'Baixa Geração MMGD', color: mmgdLevelColors.LOW },
      { type: 'LVL_MEDIUM', label: 'Média Geração MMGD', color: mmgdLevelColors.MEDIUM },
      { type: 'LVL_HIGH', label: 'Alta Geração MMGD', color: mmgdLevelColors.HIGH },
      { type: 'WIND', label: 'Eólica', color: resourceColors.WIND },
      { type: 'SOLAR', label: 'Solar', color: resourceColors.SOLAR },
      { type: 'BESS', label: 'BESS', color: resourceColors.BESS },
    ];
  }, [mode, resourceLegend]);

  const resourceScatterData = useMemo(() => {
    return resourceList
      .map((resource) => {
        const value = normalizeCoordinates(resource.coordinates ?? resource.coords ?? resource.position ?? resource.point);

        if (!value || value.length < 2) return null;

        const lon = Number(value[0]);
        const lat = Number(value[1]);

        if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

        const type = String(resource.type || resource.kind || resource.category || 'DEFAULT').toUpperCase();
        const icon = resourceIcons[type] || resourceIcons.DEFAULT;

        // Prioriza a cor por TIPO (SOLAR_PLANT -> ambar) sobre o fallback do util.
        const pointColor = resourceColors[type] || resource.color || resourceColors.DEFAULT;

        return {
          name: resource.label || resource.name || type,
          value: [lon, lat],
          type,
          estado: resource.estado || resource.uf,
          color: pointColor,
          symbol: icon,
          symbolSize: 16,
          itemStyle: {
            color: pointColor,
            borderColor: 'rgba(255,255,255,0.85)',
            borderWidth: 1,
            shadowBlur: 14,
            shadowColor: pointColor,
          },
        };
      })
      .filter(Boolean);
  }, [resourceList]);

  // Poligonos desenhados sobre o mapa: no modo MMGD usa as zonas MMGD (por nivel
  // de geracao); no modo curtailment usa as zonas de risco.
  // Poligonos de zona (custom series) so no modo curtailment (risco).
  const zoneList = useMemo(() => {
    const source = mode === 'curtailment' ? riskZones : [];
    return (Array.isArray(source) ? source : [])
      .map((zone) => {
        const polygon = (zone.polygon || [])
          .map((pt) => normalizeCoordinates(pt))
          .filter((pt) => Array.isArray(pt) && pt.length >= 2);
        if (polygon.length < 3) return null;
        return { ...zone, polygon };
      })
      .filter(Boolean);
  }, [mode, riskZones]);

  // No modo MMGD: colore os ESTADOS REAIS (regions do geo) por nivel de geracao.
  const geoRegions = useMemo(() => {
    if (mode !== 'mmgd') return [];
    return Object.entries(mmgdLevels || {})
      .map(([uf, level]) => {
        const name = ufToStateName[String(uf).toUpperCase()];
        const color = mmgdLevelColors[String(level).toUpperCase()];
        if (!name || !color) return null;
        return {
          name,
          itemStyle: { areaColor: `${color}3a`, borderColor: color, borderWidth: 1.4 },
          emphasis: { itemStyle: { areaColor: `${color}66` } },
        };
      })
      .filter(Boolean);
  }, [mode, mmgdLevels]);

  // Dados da custom series de zonas (memoizado para nao recriar a cada render).
  const zoneData = useMemo(
    () => zoneList.map((zone) => ({ name: zone.label, value: zone.curtailmentProb, zone })),
    [zoneList]
  );

  // Ponto 3: cria a instancia do ECharts e registra o mapa do Brasil UMA vez.
  // O GeoJSON so e carregado/registrado uma vez; a instancia nunca e recriada.
  useEffect(() => {
    let isMounted = true;

    async function initChart() {
      if (!mapRef.current) return;

      const geoJsonModule = await import('../assets/resources/brazil-states.json');
      if (!isMounted) return;
      const geoJson = geoJsonModule.default || geoJsonModule;
      geoFeaturesRef.current = geoJson.features || null;
      if (!echarts.getMap('brasil')) {
        echarts.registerMap('brasil', geoJson);
      }

      if (!isMounted) return;

      // Renderizador Canvas para alta performance e fluidez a 60 FPS
      const chart = echarts.init(mapRef.current, null, { renderer: 'canvas' });
      chartInstanceRef.current = chart;

      chart.setOption({
        backgroundColor: 'transparent',
        // Tooltip nativo desligado: o modal do ponto critico (curtailment) e o
        // tooltip de estado (MMGD) sao tratados por um tooltip DOM customizado
        // (mousemove) com deteccao por proximidade de pixel (mínima area).
        tooltip: { show: false },
        geo: {
          map: 'brasil',
          roam: true, // Habilita Zoom e Pan fluidos
          zoom: 2.9,
          center: [-41.5, -9.2], // Centrado no cluster de recursos do NE
          scaleLimit: { min: 0.8, max: 10 },
          label: { show: false },
          itemStyle: {
            areaColor: '#0b1320',
            borderColor: '#1e293b',
            borderWidth: 1,
          },
          emphasis: {
            label: { show: false },
            itemStyle: { areaColor: '#152238', borderColor: '#38bdf8' },
          },
          select: { disabled: true },
        },
        series: [],
      });

      setLoading(false);
      // Sinaliza que a instancia existe -> dispara o effect que desenha as series.
      setChartReady(true);
    }

    initChart();

    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      setChartReady(false);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // Clique numa REGIAO (poligono MMGD) -> atualiza os dados do estado da zona.
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || !chartReady) return;

    const handleClick = (params) => {
      if (typeof onSelectState !== 'function') return;
      // Clique no ESTADO real (geo) -> UF pelo nome; ou na zona (curtailment).
      let uf = params?.data?.zone?.uf;
      if (!uf && params?.componentType === 'geo' && params?.name) {
        uf = stateNameToUf[params.name];
      }
      if (uf) onSelectState(String(uf).toUpperCase());
    };

    chart.on('click', handleClick);
    return () => chart.off('click', handleClick);
  }, [chartReady, onSelectState]);

  // Hover de estado (modo MMGD): tooltip preciso via pixel -> UF (menor area).
  // Mantem o ponto critico acessivel ao handler de mousemove (curtailment).
  useEffect(() => {
    criticalRef.current = critical;
  }, [critical]);

  // Hover customizado (mínima area via pixel):
  //  - MMGD: mostra o estado sob o cursor (pixel -> UF, point-in-polygon).
  //  - Curtailment: mostra o modal do ponto critico quando o cursor esta perto dele.
  useEffect(() => {
    const chart = chartInstanceRef.current;
    const tip = tooltipRef.current;
    if (!chart || !chartReady || !tip) return;

    const zr = chart.getZr();
    const hideTip = () => { tip.style.display = 'none'; };

    let lastRun = 0;
    const handleMove = (event) => {
      const now = Date.now();
      if (now - lastRun < 30) return;
      lastRun = now;
      const pixel = [event.offsetX, event.offsetY];

      // No curtailment: prioridade para o modal do ponto critico (proximidade).
      if (mode === 'curtailment') {
        const cp = criticalRef.current;
        if (cp && Array.isArray(cp.coordinates)) {
          const cpPixel = chart.convertToPixel({ geoIndex: 0 }, cp.coordinates);
          if (cpPixel) {
            const d = Math.sqrt((cpPixel[0] - pixel[0]) ** 2 + (cpPixel[1] - pixel[1]) ** 2);
            if (d <= 18) {
              tip.innerHTML = `
                <div style="font-family:'Space Mono',ui-monospace,monospace;min-width:220px;">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px;">
                    <span style="font-weight:700;color:#f8fafc;font-size:14px;"><span style="color:#ef4444;">●</span> ${cp.name || 'NE — Sobradinho'}</span>
                    <span style="border:1px solid #ef4444;color:#ff6b6b;font-size:11px;padding:2px 10px;border-radius:5px;">${cp.severity || 'Critical'}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;color:#8ea1b8;font-size:13px;margin-bottom:4px;"><span>Curtailment Prob.:</span><strong style="color:#ff6b6b;">${cp.curtailmentProb ?? 78}%</strong></div>
                  <div style="display:flex;justify-content:space-between;color:#8ea1b8;font-size:13px;margin-bottom:4px;"><span>Volume at Risk:</span><strong style="color:#f8fafc;">${cp.volumeAtRisk ?? 320} MW</strong></div>
                  <div style="display:flex;justify-content:space-between;color:#8ea1b8;font-size:13px;margin-bottom:12px;"><span>Affected Assets:</span><strong style="color:#f8fafc;">${cp.affectedAssets ?? 12}</strong></div>
                  <div style="color:#f5a524;font-size:13px;font-weight:700;">View risk telemetry &rarr;</div>
                </div>`;
              tip.style.display = 'block';
              tip.style.left = `${pixel[0] + 14}px`;
              tip.style.top = `${pixel[1] + 14}px`;
              return;
            }
          }
        }
        // Fora do ponto critico: cai no hover de estado (mesmo do MMGD).
      }

      // Hover de estado (MMGD e curtailment): UF real via pixel -> point-in-polygon.
      if (!chart.containPixel({ geoIndex: 0 }, pixel)) { hideTip(); return; }
      const lonLat = chart.convertFromPixel({ geoIndex: 0 }, pixel);
      const uf = Array.isArray(lonLat) ? ufFromCoord(lonLat, geoFeaturesRef.current) : null;
      if (!uf) { hideTip(); return; }
      const name = ufToStateName[uf] || uf;
      tip.innerHTML = `<span style="color:#cbd6e6;font-size:12px;font-weight:600;">${name}</span>`;
      tip.style.display = 'block';
      tip.style.left = `${pixel[0] + 14}px`;
      tip.style.top = `${pixel[1] + 14}px`;
    };

    zr.on('mousemove', handleMove);
    zr.on('globalout', hideTip);
    return () => {
      zr.off('mousemove', handleMove);
      zr.off('globalout', hideTip);
      hideTip();
    };
  }, [chartReady, mode]);

  // Aplica a coloracao por nivel MMGD nos estados reais (regions do geo).
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || !chartReady) return;
    chart.setOption({ geo: { regions: geoRegions } });
  }, [geoRegions, chartReady]);

  // Ponto 3: atualiza APENAS as series quando os dados mudam, via setOption
  // (merge incremental) — sem recriar a instancia nem re-registrar o mapa.
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    const [critLon, critLat] = critical.coordinates;

    // Zonas de risco (poligonos "shapefile") desenhadas sobre o geo via custom series.
    const hexToRgba = (hex, alpha) => {
      const h = String(hex).replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const zoneSeries = {
      name: 'Zonas de Risco',
      type: 'custom',
      coordinateSystem: 'geo',
      z: 6,
      // Poligonos clicaveis (atualiza dados do estado); sem hover.
      silent: false,
      emphasis: { disabled: true },
      data: zoneData,
      renderItem: (params, api) => {
        const zone = zoneList[params.dataIndex];
        if (!zone) return null;
        const pts = zone.polygon.map((c) => api.coord(c));
        if (!pts.length) return null;
        const color = zone.color || '#94a3b8';

        // Centroide (media dos vertices) para posicionar o rotulo da UF.
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
        const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;

        return {
          type: 'group',
          children: [
            {
              type: 'polygon',
              shape: { points: pts },
              style: {
                fill: hexToRgba(color, 0.2),
                stroke: color,
                lineWidth: 1.5,
                lineDash: [6, 4],
              },
              cursor: 'pointer',
            },
            {
              type: 'text',
              style: {
                text: zone.label || '',
                x: cx,
                y: cy,
                textAlign: 'center',
                textVerticalAlign: 'middle',
                fontSize: 13,
                fontWeight: 700,
                fill: color,
              },
              silent: true,
            },
          ],
        };
      },
      // Sem tooltip (interacao e por clique).
      tooltip: { show: false },
    };

    // Linhas + ponto critico so aparecem no modo "Risco de Curtailment".
    // As zonas (poligonos) sao renderizadas nos dois modos (zoneSeries abaixo).
    // Alvos das linhas: alguns recursos ao redor do ponto critico (foto 2).
    const resTargets = resourceScatterData
      .map((r) => r.value)
      .filter((v) => Array.isArray(v));
    const cyanTarget = resTargets[0] || [safeLon, safeLat];
    const redTargets = resTargets.slice(1, 3);

    const curtailmentSeries = mode === 'curtailment' ? [
      // Linha solida ciano (conexao principal).
      {
        type: 'lines',
        coordinateSystem: 'geo',
        data: [{ coords: [cyanTarget, [critLon, critLat]] }],
        lineStyle: { color: '#38bdf8', width: 2.5, opacity: 0.9 },
        z: 4,
      },
      // Linhas tracejadas vermelhas (rotas de risco a partir do ponto critico).
      {
        type: 'lines',
        coordinateSystem: 'geo',
        data: redTargets.map((t) => ({ coords: [[critLon, critLat], t] })),
        lineStyle: { color: '#ef4444', width: 2, opacity: 0.85, type: 'dashed' },
        z: 4,
      },
      {
        name: 'Ponto Crítico',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: [{ name: critical.name, value: [critLon, critLat, 100], critical }],
        symbolSize: 16,
        showEffectOn: 'render',
        rippleEffect: {
          brushType: 'stroke',
          scale: 6,
          period: 3,
          color: '#f97316',
        },
        itemStyle: {
          color: '#ef4444',
          shadowBlur: 30,
          shadowColor: 'rgba(249, 115, 22, 0.9)',
        },
        z: 12,
      },
    ] : [];

    chart.setOption({
      series: [
        zoneSeries,
        ...curtailmentSeries,
        {
          name: 'Recursos',
          type: 'scatter',
          coordinateSystem: 'geo',
          // Cada ponto ja traz symbol/symbolSize/itemStyle proprios no data.
          // No modo MMGD os recursos ficam maiores/destacados (visao de geracao).
          data: resourceScatterData,
          z: 10,
          symbolSize: mode === 'mmgd' ? 20 : undefined,
          // No modo MMGD os icones nao capturam clique: o clique vai para a REGIAO.
          silent: mode === 'mmgd',
          emphasis: { disabled: true },
          tooltip: { show: false },
        },
      ],
    }, { replaceMerge: 'series' });
  }, [safeLon, safeLat, resourceScatterData, critical, chartReady, zoneList, zoneData, mode]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '190px', backgroundColor: '#070c14', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
      {/* Tooltip de estado (modo MMGD), posicionado no cursor. */}
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute', display: 'none', zIndex: 20, pointerEvents: 'none',
          background: '#0d131d', border: '1px solid rgba(148,163,184,0.35)',
          borderRadius: '8px', padding: '6px 10px', boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
        }}
      />
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
          Carregando mapa do Brasil...
        </div>
      )}

      <div ref={mapRef} style={{ width: '100%', flex: '1 1 auto', minHeight: '150px', overflow: 'hidden' }} />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px 14px',
          padding: '8px 10px 0',
          color: '#dfeaf8',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          marginTop: '6px',
        }}
      >
        {(legendItems.length ? legendItems : pointRows).map((entry) => (
          <div key={entry.type || entry.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: entry.color,
                boxShadow: `0 0 8px ${entry.color}`,
              }}
            />
            <span style={{ color: '#e2e8f0' }}>{entry.label || entry.type || 'Resource'}</span>
            {entry.value ? <strong style={{ color: '#f8fafc', fontWeight: 700 }}>{entry.value}</strong> : null}
          </div>
        ))}
      </div>
    </div>
  );
}