import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'

// Grafico "Simulation Output — Generation Forecast".
// Plota P90 (tracejado azul), P50/Avg (solido laranja) e P10 (tracejado cinza)
// a partir de dados (forecastSeries), com area sombreada de cenarios entre P10 e P90.
// Tooltip nativo do ECharts torna os valores clicaveis/inspecionaveis no hover.
export default function ForecastChart({ hours, series }) {
  const ref = useRef(null)
  const instanceRef = useRef(null)

  // Option memoizada: so recalcula quando horas/series mudam.
  const option = useMemo(() => {
    const p90 = series?.p90 || []
    const p10 = series?.p10 || []

    // Banda de cenarios: base = P10, topo = (P90 - P10) empilhado transparente.
    const bandBase = p10
    const bandSpan = p90.map((v, i) => Math.max(0, v - (p10[i] ?? 0)))

    return {
      backgroundColor: 'transparent',
      grid: { left: 48, right: 16, top: 16, bottom: 28 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0d131d',
        borderColor: 'rgba(148,163,184,0.3)',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        textStyle: { color: '#e8eef7', fontSize: 12 },
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(148,163,184,0.4)' } },
        formatter: (params) => {
          const hour = params?.[0]?.axisValue ?? ''
          // Ignora as series auxiliares da banda (base/span) no tooltip.
          const rows = params
            .filter((p) => ['P90', 'P50 (Avg)', 'P10'].includes(p.seriesName))
            .map(
              (p) =>
                `<div style="display:flex;justify-content:space-between;gap:16px;">
                   <span>${p.marker} ${p.seriesName}</span>
                   <strong style="color:#f4f9ff;">${Number(p.value).toLocaleString()} MW</strong>
                 </div>`
            )
            .join('')
          return `<div style="font-size:11px;color:#8ea1b8;margin-bottom:6px;">${hour}</div>${rows}`
        },
      },
      xAxis: {
        type: 'category',
        data: hours || [],
        boundaryGap: false,
        axisLine: { lineStyle: { color: 'rgba(148,163,184,0.25)' } },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(214,222,234,0.75)', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 4000,
        interval: 1000,
        axisLabel: {
          color: 'rgba(214,222,234,0.7)',
          fontSize: 10,
          formatter: (v) => `${v.toLocaleString()} MW`,
        },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.16)', type: 'dashed' } },
      },
      series: [
        // Banda de cenarios (P10..P90): duas series stack, a base invisivel.
        {
          name: 'ScenariosBase',
          type: 'line',
          stack: 'band',
          data: bandBase,
          lineStyle: { opacity: 0 },
          areaStyle: { opacity: 0 },
          symbol: 'none',
          silent: true,
          z: 1,
        },
        {
          name: 'Scenarios',
          type: 'line',
          stack: 'band',
          data: bandSpan,
          lineStyle: { opacity: 0 },
          areaStyle: { color: 'rgba(148, 163, 184, 0.14)' },
          symbol: 'none',
          silent: true,
          z: 1,
        },
        {
          name: 'P90',
          type: 'line',
          data: series?.p90 || [],
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { color: '#5ed7ff', width: 2, type: 'dashed' },
          itemStyle: { color: '#5ed7ff' },
          z: 3,
        },
        {
          name: 'P50 (Avg)',
          type: 'line',
          data: series?.p50 || [],
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { color: '#f5a524', width: 2.8 },
          itemStyle: { color: '#f5a524' },
          z: 4,
        },
        {
          name: 'P10',
          type: 'line',
          data: series?.p10 || [],
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          showSymbol: false,
          lineStyle: { color: 'rgba(203,213,225,0.7)', width: 2, type: 'dashed' },
          itemStyle: { color: 'rgba(203,213,225,0.9)' },
          z: 3,
        },
      ],
    }
  }, [hours, series])

  // Cria a instancia UMA vez.
  useEffect(() => {
    if (!ref.current) return undefined
    const chart = echarts.init(ref.current)
    instanceRef.current = chart
    const onResize = () => chart.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chart.dispose()
      instanceRef.current = null
    }
  }, [])

  // Atualiza via setOption (sem recriar).
  useEffect(() => {
    instanceRef.current?.setOption(option)
  }, [option])

  return <div ref={ref} className="home-chart" />
}
