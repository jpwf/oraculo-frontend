import { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';

const resourceColors = {
  WIND: '#38bdf8',
  SOLAR: '#f59e0b',
  SOLAR_FARM: '#f59e0b',
  MMGD: '#34d399',
  BESS: '#a78bfa',
  DEFAULT: '#f8fafc',
};

const resourceIcons = {
  WIND: 'triangle',
  SOLAR: 'rect',
  SOLAR_FARM: 'rect',
  MMGD: 'diamond',
  BESS: 'roundRect',
  DEFAULT: 'circle',
};

export default function RiskMap({ coordinates, points = [], resources = [] }) {
  const mapRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);

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

  const resourceLegend = Array.from(
    new Map(
      resourceList.map((resource) => {
        const type = String(resource.type || 'DEFAULT').toUpperCase();
        return [
          type,
          {
            type,
            label: resource.label || resource.name || type,
            color: resource.color || resourceColors[type] || resourceColors.DEFAULT,
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

        return {
          name: resource.label || resource.name || type,
          value: [lon, lat],
          type,
          color: resource.color || resourceColors[type] || resourceColors.DEFAULT,
          symbol: icon,
          symbolSize: 12,
          itemStyle: {
            color: resource.color || resourceColors[type] || resourceColors.DEFAULT,
            shadowBlur: 10,
            shadowColor: resource.color || resourceColors[type] || resourceColors.DEFAULT,
          },
        };
      })
      .filter(Boolean);
  }, [resourceList]);

  useEffect(() => {
    let isMounted = true;

    async function initChart() {
      if (!mapRef.current) return;

      
      if (!echarts.getMap('brasil')) {
        const geoJsonModule = await import('../assets/resources/brazil-states.json');
        if (isMounted) {
          echarts.registerMap('brasil', geoJsonModule.default || geoJsonModule);
        }
      }

      if (!isMounted) return;

      // Limpa instância prévia para evitar estouro de memória/erros do React StrictMode
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
      }

      // Renderizador Canvas para alta performance e fluidez a 60 FPS
      const chart = echarts.init(mapRef.current, null, { renderer: 'canvas' });
      chartInstanceRef.current = chart;

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: '#111827',
          borderColor: '#ef4444',
          borderWidth: 1,
          padding: 10,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: (params) => {
            if (params.seriesType === 'effectScatter') {
              return `
                <div style="font-family: sans-serif;">
                  <div style="font-weight: bold; color: #f8fafc; margin-bottom: 4px;">
                    ● ${params.name} <span style="background:#ef4444; color:#fff; font-size:9px; padding:1px 4px; border-radius:2px;">CRITICAL</span>
                  </div>
                  <div style="color: #94a3b8; font-size: 11px;">Curtailment Prob.: <strong style="color: #ef4444;">78%</strong></div>
                  <div style="color: #94a3b8; font-size: 11px;">Volume at Risk: <strong style="color: #fff;">320 MW</strong></div>
                </div>
              `;
            }
            return params.name || '';
          },
        },
        geo: {
          map: 'brasil',
          roam: true, // Habilita Zoom e Pan fluidos
          zoom: 3.2,
          center: [-42.5, -9.5], // Centro geográfico do Brasil
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
        series: [
          {
            type: 'lines',
            coordinateSystem: 'geo',
            data: [
              {
                coords: [[safeLon, safeLat], [-40.5, -9.41]],
              },
              {
                coords: [[-40.5, -9.41], [-38.5, -12.97]],
              },
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
            data: [{ name: 'NE—Sobradinho', value: [safeLon, safeLat, 100] }],
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
            data: resourceScatterData,
            symbol: (value, params) => params?.data?.symbol || 'circle',
            symbolSize: (value, params) => params?.data?.symbolSize || 12,
            zlevel: 10,
            emphasis: {
              itemStyle: {
                shadowBlur: 12,
              },
            },
            tooltip: {
              show: true,
            },
          },
        ],
      };

      chart.setOption(option);
      setLoading(false);
    }

    initChart();

    const handleResize = () => chartInstanceRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [safeLon, safeLat, resourceScatterData]);

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