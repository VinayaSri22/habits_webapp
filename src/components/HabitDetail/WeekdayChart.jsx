import { weekdayLabelsMondayFirst } from '../../utils/dateUtils.js'

export function WeekdayChart({ counts, color }) {
  const labels = weekdayLabelsMondayFirst()
  const max = Math.max(1, ...counts)

  return (
    <div className="weekday-chart" role="img" aria-label="Completions by day of week">
      {counts.map((count, index) => (
        <div key={labels[index]} className="weekday-col">
          <div className="weekday-bar-track">
            <div
              className="weekday-bar"
              style={{
                height: `${(count / max) * 100}%`,
                background: color,
              }}
            />
          </div>
          <span className="weekday-count">{count}</span>
          <span className="weekday-label">{labels[index]}</span>
        </div>
      ))}
    </div>
  )
}
