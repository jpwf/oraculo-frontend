import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import './components.css'

function SimulationOutputChart({ simulation, loading = false }) {
  const chartRef = useRef(null)
  const chartInstanceRef = useRef(null)

  const {
    title,
    subtitle,
    yMax,
    timeLabels,
    absorptionLimit,
    totalGeneration,
    curtailment,
    peak,
    peakIndex,
  } = simulation

  const option = useMemo(() => {
    const hatchCanvas = (() => {
      const c = document.createElement('canvas')
      c.width = 8
      c.height = 8
      const ctx = c.getContext('2d')
      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)'
      ctx.fillRect(0, 0, 8, 8)
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)'
      ctx.lineWidth = 1.4
      ctx.beginPath()
      ctx.moveTo(0, 8)
      ctx.lineTo(8, 0)
      ctx.stroke()
      return c
    })()
    const hatch = { image: hatchCanvas, repeat: 'repeat' }

    const peakValue = peak?.value ?? 0
    const peakLabel = `${peak?.label ?? 'Corte Previsto'}: ${Number(peakValue).toLocaleString('pt-BR')} ${peak?.unit ?? 'MW'}`
    const peakTopY = totalGeneration[peakIndex] ?? 0

    return {
      backgroundColor: 'transparent',
      grid: { top: 28, right: 20, bottom: 46, left: 58 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(13, 20, 33, 0.95)',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
        textStyle: { color: '#e6ebf5', fontSize: 12 },
        axisPointer: { type: 'line', lineStyle: { color: 'rgba(255,255,255,0.25)' } },
        formatter: (params) => {
          if (!Array.isArray(params) || !params.length) return ''
          const idx = params[0].dataIndex
          const fmt = (v) => `${Number(v).toLocaleString('pt-BR')} MW`
          return [
            `<strong>${timeLabels[idx]}</strong>`,
            `<span style="color:#22d3ee">●</span> Limite de Absorção: ${fmt(absorptionLimit[idx])}`,
            `<span style="color:#f59e0b">●</span> Geração Total Prevista: ${fmt(totalGeneration[idx])}`,
            `<span style="color:#ef4444">●</span> Corte de Geração: ${fmt(curtailment[idx])}`,
          ].join('<br/>')
        },
      },
      legend: {
        show: true,
        top: 0,
        right: 8,
        itemWidth: 18,
        itemHeight: 10,
        textStyle: { color: 'rgba(219,225,235,0.85)', fontSize: 11 },
        data: [
          { name: 'Limite de Absorção' },
          { name: 'Geração Total Prevista' },
          { name: 'Corte de Geração' },
        ],
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeLabels,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.18)' } },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(219,225,235,0.7)',
          fontSize: 10,
          interval: (index) => index === 0 || index === timeLabels.length - 1 || index % 2 === 0,
        },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: yMax,
        interval: yMax / 4,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: 'rgba(219,225,235,0.7)',
          fontSize: 10,
          formatter: (value) => (value === 0 ? '0' : `${Number(value).toLocaleString('pt-BR')} MW`),
        },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.08)', type: 'dashed' } },
      },
      series: [
        {
          name: '__corte_base__',
          type: 'line',
          stack: 'corte',
          data: absorptionLimit,
          symbol: 'none',
          lineStyle: { opacity: 0 },
          areaStyle: { opacity: 0 },
          silent: true,
          tooltip: { show: false },
          legendHoverLink: false,
          z: 1,
        },
        {
          name: 'Corte de Geração',
          type: 'line',
          stack: 'corte',
          data: curtailment,
          symbol: 'none',
          lineStyle: { width: 0 },
          areaStyle: { color: hatch },
          itemStyle: { color: '#ef4444' },
          z: 2,
        },
        {
          name: 'Limite de Absorção',
          type: 'line',
          data: absorptionLimit,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#22d3ee', width: 2, type: 'dashed' },
          itemStyle: { color: '#22d3ee' },
          z: 4,
        },
        {
          name: 'Geração Total Prevista',
          type: 'line',
          data: totalGeneration,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#f59e0b', width: 2.5 },
          itemStyle: { color: '#f59e0b' },
          z: 5,
          markPoint: {
            symbol: 'pin',
            symbolSize: 46,
            itemStyle: { color: '#ef4444' },
            label: {
              show: true,
              position: 'top',
              distance: 8,
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: 'rgba(239, 68, 68, 0.92)',
              padding: [4, 8],
              borderRadius: 6,
              formatter: peakLabel,
            },
            data: [{ coord: [peakIndex, peakTopY] }],
          },
        },
      ],
    }
  }, [timeLabels, absorptionLimit, totalGeneration, curtailment, peak, peakIndex, yMax])

  useEffect(() => {
    if (!chartRef.current) return undefined

    const chart = echarts.init(chartRef.current)
    chartInstanceRef.current = chart

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
      chartInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    chartInstanceRef.current?.setOption(option)
  }, [option])

  return (
    <div className="sim-output">
      <div className="sim-output-header">
        <h2 className="sim-output-title">{title}</h2>
        <span className="sim-output-subtitle">{subtitle}</span>
      </div>
      <div className={`sim-output-chart ${loading ? 'is-loading' : ''}`}>
        <div ref={chartRef} className="sim-output-canvas" />
      </div>
    </div>
  )
}

export default SimulationOutputChart
