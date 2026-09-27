import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'

export default function ForecastVsObservedChart({ hours, forecast, observed }) {
  const ref = useRef(null)
  const instanceRef = useRef(null)

  const option = useMemo(() => {
    const forecastData = Array.isArray(forecast) ? forecast : []
    const observedData = Array.isArray(observed) ? observed : []

    const allValues = [...forecastData, ...observedData].filter((v) => Number.isFinite(v))
    const maxValue = allValues.length ? Math.max(...allValues) : 1000
    const yMax = Math.ceil((maxValue * 1.15) / 100) * 100

    return {
      backgroundColor: 'transparent',
      grid: { left: 52, right: 16, top: 16, bottom: 28 },
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
          const rows = params
            .filter((p) => Number.isFinite(p.value))
            .map(
              (p) =>
                `<div style="display:flex;justify-content:space-between;gap:16px;">
                   <span>${p.marker} ${p.seriesName}</span>
                   <strong style="color:#f4f9ff;">${Number(p.value).toLocaleString('pt-BR')} MW</strong>
                 </div>`
            )
            .join('')
          return `<div style="font-size:11px;color:#8ea1b8;margin-bottom:6px;">${hour}</div>${rows}`
        },
      },
      legend: {
        show: true,
        top: 0,
        right: 4,
        itemWidth: 20,
        itemHeight: 10,
        textStyle: { color: 'rgba(219,225,235,0.85)', fontSize: 11 },
        data: ['Previsto', 'Observado'],
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
        max: yMax,
        axisLabel: {
          color: 'rgba(214,222,234,0.7)',
          fontSize: 10,
          formatter: (v) => `${Number(v).toLocaleString('pt-BR')} MW`,
        },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.16)', type: 'dashed' } },
      },
      series: [
        {
          name: 'Previsto',
          type: 'line',
          data: forecastData,
          smooth: true,
          showSymbol: false,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#f5a524', width: 2.4, type: 'dashed' },
          itemStyle: { color: '#f5a524' },
          z: 3,
        },
        {
          name: 'Observado',
          type: 'line',
          data: observedData,
          smooth: true,
          connectNulls: false,
          showSymbol: false,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#5ed7ff', width: 2.8 },
          itemStyle: { color: '#5ed7ff' },
          areaStyle: { color: 'rgba(94, 215, 255, 0.10)' },
          z: 4,
        },
      ],
    }
  }, [hours, forecast, observed])

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

  useEffect(() => {
    instanceRef.current?.setOption(option, { notMerge: true })
  }, [option])

  return <div ref={ref} className="home-chart" />
}
