import { useId, useState } from 'react'
import { formatMonthYear, formatShortDate } from '../../utils/dateUtils.js'

export function ScoreChart({ series, color }) {
  const [hover, setHover] = useState(null)
  const clipId = useId().replace(/:/g, '')
  const width = 640
  const height = 200
  const pad = { top: 16, right: 12, bottom: 28, left: 36 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const max = 1
  const last = series.at(-1)

  function xFor(index) {
    if (series.length <= 1) return pad.left
    return pad.left + (index / (series.length - 1)) * innerW
  }

  function yFor(value) {
    return pad.top + (1 - value / max) * innerH
  }

  const line = series
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${xFor(index).toFixed(2)} ${yFor(point.value).toFixed(2)}`)
    .join(' ')

  const area = series.length
    ? `${line} L${xFor(series.length - 1).toFixed(2)} ${pad.top + innerH} L${xFor(0).toFixed(2)} ${pad.top + innerH} Z`
    : ''

  const ticks = [0, 0.5, 1]
  const monthTicks = monthMarkers(series)

  return (
    <div className="chart-wrap">
      <svg
        className="score-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Habit score over time, currently ${Math.round((last?.value ?? 0) * 100)} percent`}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`${clipId}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
              className="chart-grid"
            />
            <text x={pad.left - 8} y={yFor(tick) + 4} className="chart-tick" textAnchor="end">
              {Math.round(tick * 100)}
            </text>
          </g>
        ))}
        {area ? <path d={area} fill={`url(#${clipId}-fill)`} /> : null}
        {line ? <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /> : null}
        {monthTicks.map((marker) => (
          <text key={`${marker.index}-${marker.label}`} x={xFor(marker.index)} y={height - 8} className="chart-tick" textAnchor="middle">
            {marker.label}
          </text>
        ))}
        {hover ? (
          <g>
            <line
              x1={xFor(hover)}
              x2={xFor(hover)}
              y1={pad.top}
              y2={pad.top + innerH}
              className="chart-grid"
            />
            <circle cx={xFor(hover)} cy={yFor(series[hover].value)} r="4.5" fill={color} />
          </g>
        ) : null}
        <rect
          x={pad.left}
          y={pad.top}
          width={innerW}
          height={innerH}
          fill="transparent"
          onMouseMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect()
            const ratio = (event.clientX - bounds.left) / bounds.width
            const index = Math.min(series.length - 1, Math.max(0, Math.round(ratio * (series.length - 1))))
            setHover(index)
          }}
        />
      </svg>
      {hover != null && series[hover] ? (
        <p className="chart-caption">
          {formatShortDate(series[hover].date)} · {Math.round(series[hover].value * 100)}%
        </p>
      ) : (
        <p className="chart-caption">Score stays with you after missed days — it decays, it does not reset.</p>
      )}
    </div>
  )
}

function monthMarkers(series) {
  const markers = []
  let previousMonth = ''
  series.forEach((point, index) => {
    const month = point.date.slice(0, 7)
    if (month !== previousMonth && (index === 0 || point.date.endsWith('-01'))) {
      markers.push({ index, label: formatMonthYear(point.date).split(' ')[0] })
      previousMonth = month
    }
  })
  if (markers.length <= 5) return markers
  return markers.filter((_, index) => index === 0 || index === markers.length - 1 || index % 2 === 0)
}
