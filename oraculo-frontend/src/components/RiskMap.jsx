import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';

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

export default function RiskMap({ coordinates, points = [], resources = [], criticalPoint = null }) {
  const mapRef = useRef(null);
  const chartInstanceRef = useRef(null);
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

  // Ponto 3: cria a instancia do ECharts e registra o mapa do Brasil UMA vez.
  // O GeoJSON so e carregado/registrado uma vez; a instancia nunca e recriada.
  useEffect(() => {
    let isMounted = true;

    async function initChart() {
      if (!mapRef.current) return;

      if (!echarts.getMap('brasil')) {
        const geoJsonModule = await import('../assets/resources/brazil-states.json');
        if (!isMounted) return;
        echarts.registerMap('brasil', geoJsonModule.default || geoJsonModule);
      }

      if (!isMounted) return;

      // Renderizador Canvas para alta performance e fluidez a 60 FPS
      const chart = echarts.init(mapRef.current, null, { renderer: 'canvas' });
      chartInstanceRef.current = chart;

      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: '#0d131d',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 10,
          padding: 14,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params) => {
            if (params.seriesType === 'effectScatter') {
              const cp = params?.data?.critical || {};
              const name = cp.name || params.name || 'Critical Node';
              const severity = cp.severity || 'Critical';
              const prob = Number.isFinite(Number(cp.curtailmentProb)) ? Number(cp.curtailmentProb) : 78;
              const volume = Number.isFinite(Number(cp.volumeAtRisk)) ? Number(cp.volumeAtRisk) : 320;
              const assets = Number.isFinite(Number(cp.affectedAssets)) ? Number(cp.affectedAssets) : 12;
              return `
                <div style="font-family: 'Space Mono', ui-monospace, monospace; min-width: 210px;">
                  <div style="display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:10px;">
                    <span style="font-weight:700; color:#f8fafc; font-size:13px;">
                      <span style="color:#ef4444;">●</span> ${name}
                    </span>
                    <span style="border:1px solid #ef4444; color:#ff6b6b; font-size:10px; padding:2px 8px; border-radius:5px; letter-spacing:0.03em;">${severity}</span>
                  </div>
                  <div style="display:flex; justify-content:space-between; color:#8ea1b8; font-size:12px; margin-bottom:3px;">
                    <span>Curtailment Prob.:</span><strong style="color:#ff6b6b;">${prob}%</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between; color:#8ea1b8; font-size:12px; margin-bottom:3px;">
                    <span>Volume at Risk:</span><strong style="color:#f8fafc;">${volume} MW</strong>
                  </div>
                  <div style="display:flex; justify-content:space-between; color:#8ea1b8; font-size:12px; margin-bottom:10px;">
                    <span>Affected Assets:</span><strong style="color:#f8fafc;">${assets}</strong>
                  </div>
                  <div style="color:#f5a524; font-size:12px; font-weight:700;">View risk telemetry &rarr;</div>
                </div>
              `;
            }
            return params.name || '';
          },
        },
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
            itemStyle: {
              areaColor: '#111d33',
              borderColor: '#38bdf8',
            },
          },
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

  // Ponto 3: atualiza APENAS as series quando os dados mudam, via setOption
  // (merge incremental) — sem recriar a instancia nem re-registrar o mapa.
  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    const [critLon, critLat] = critical.coordinates;

    chart.setOption({
      series: [
        {
          type: 'lines',
          coordinateSystem: 'geo',
          // Linhas convergindo do centro de risco para o ponto critico (cruzamento).
          data: [
            { coords: [[safeLon, safeLat], [critLon, critLat]] },
            { coords: [[critLon, critLat], [-38.5, -12.97]] },
          ],
          lineStyle: {
            color: '#38bdf8',
            width: 2,
            opacity: 0.85,
          },
        },
        {
          name: 'Ponto Crítico',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          // Ponto definido pelo cruzamento de coordenadas; carrega os dados do modal.
          data: [{ name: critical.name, value: [critLon, critLat, 100], critical }],
          symbolSize: 12,
          showEffectOn: 'render',
          rippleEffect: {
            brushType: 'fill',
            scale: 4,
            color: '#f97316',
          },
          itemStyle: {
            color: '#ef4444',
          },
        },
        {
          name: 'Recursos',
          type: 'scatter',
          coordinateSystem: 'geo',
          // Cada ponto ja traz symbol/symbolSize/itemStyle proprios no data.
          // Sem zlevel separado: usa `z` para ficar acima do geo e acompanhar o roam.
          data: resourceScatterData,
          z: 10,
          emphasis: {
            scale: 1.4,
            itemStyle: {
              shadowBlur: 16,
            },
          },
          tooltip: {
            show: true,
            formatter: (params) => {
              const d = params?.data || {};
              return `<strong style="color:#f8fafc;">${d.name || 'Resource'}</strong>`;
            },
          },
        },
      ],
    });
  }, [safeLon, safeLat, resourceScatterData, critical, chartReady]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '190px', backgroundColor: '#070c14', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
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
        {(resourceLegend.length ? resourceLegend : pointRows).map((entry) => (
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