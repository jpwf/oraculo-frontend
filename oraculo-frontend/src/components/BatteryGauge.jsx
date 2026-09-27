export default function BatteryGauge({ level = 48, allocation = 72, width = 150, height = 230 }) {
  const clampedLevel = Math.max(0, Math.min(100, Number(level) || 0))
  const clampedAlloc = Math.max(clampedLevel, Math.min(100, Number(allocation) || 0))

  const bodyX = width * 0.18
  const bodyW = width * 0.64
  const bodyY = height * 0.12
  const bodyH = height * 0.82
  const innerPad = 8
  const innerX = bodyX + innerPad
  const innerY = bodyY + innerPad
  const innerW = bodyW - innerPad * 2
  const innerH = bodyH - innerPad * 2

  const levelH = (clampedLevel / 100) * innerH
  const levelY = innerY + innerH - levelH
  const allocH = (clampedAlloc / 100) * innerH
  const allocY = innerY + innerH - allocH
  const marginH = allocH - levelH

  const capW = width * 0.24
  const capH = height * 0.045
  const capX = width / 2 - capW / 2
  const capY = bodyY - capH

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      role="img"
      aria-label={`Nível de carga da bateria: ${clampedLevel}%`}
      style={{ display: 'block', maxWidth: `${width}px`, margin: '0 auto' }}
    >
      <defs>
        <pattern id="battery-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="rgba(16, 185, 129, 0.22)" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(52, 211, 153, 0.55)" strokeWidth="3" />
        </pattern>
        <clipPath id="battery-inner">
          <rect x={innerX} y={innerY} width={innerW} height={innerH} rx="6" />
        </clipPath>
        <filter id="battery-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x={capX} y={capY} width={capW} height={capH} rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

      <rect
        x={bodyX}
        y={bodyY}
        width={bodyW}
        height={bodyH}
        rx="14"
        fill="#0b1320"
        stroke="#3b4a63"
        strokeWidth="3"
        filter="url(#battery-glow)"
      />

      <g clipPath="url(#battery-inner)">
        <rect x={innerX} y={innerY} width={innerW} height={innerH} fill="rgba(255,255,255,0.03)" />

        <rect x={innerX} y={levelY} width={innerW} height={levelH} fill="#e8edf5" />

        {marginH > 0 && (
          <rect x={innerX} y={allocY} width={innerW} height={marginH} fill="url(#battery-hatch)" />
        )}

        <line x1={innerX} y1={levelY} x2={innerX + innerW} y2={levelY} stroke="#34d399" strokeWidth="2" />

        {marginH > 22 && (
          <text
            x={innerX + innerW / 2}
            y={allocY + 16}
            textAnchor="middle"
            fill="#34d399"
            fontSize="10"
            fontWeight="600"
          >
            {clampedAlloc}%
          </text>
        )}
      </g>

      <text
        x={width / 2}
        y={levelY + Math.min(levelH * 0.4, innerH * 0.32) + 8}
        textAnchor="middle"
        fill="#0b1320"
        fontSize="30"
        fontWeight="800"
      >
        {clampedLevel}%
      </text>
    </svg>
  )
}
