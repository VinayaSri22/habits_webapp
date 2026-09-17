import { UNKNOWN } from '../../models/Entry.js'
import { heatmapIntensity } from '../../utils/analytics.js'
import { withAlpha } from '../../utils/colors.js'
import { formatDayHeading, formatMonthYear, todayKey, weekdayLabelsMondayFirst } from '../../utils/dateUtils.js'

export function CalendarHeatmap({ weeks, habit, computedEntries, color, onDayClick }) {
  const labels = weekdayLabelsMondayFirst()
  const today = todayKey()

  return (
    <div className="heatmap">
      <div className="heatmap-months">
        <span />
        {weeks.map((week) => {
          const first = week[0]
          const show = first.slice(8, 10) <= '07'
          return <span key={first}>{show ? formatMonthYear(first).split(' ')[0] : ''}</span>
        })}
      </div>
      <div className="heatmap-grid">
        <div className="heatmap-weekdays">
          {labels.map((label, index) => (
            <span key={label}>{index % 2 === 0 ? label : ''}</span>
          ))}
        </div>
        {weeks.map((week) => (
          <div key={week[0]} className="heatmap-week">
            {week.map((date) => {
              const future = date > today
              const value = computedEntries[date]?.value ?? UNKNOWN
              const intensity = future ? 0 : heatmapIntensity(habit, value)
              const heading = formatDayHeading(date)
              return (
                <button
                  key={date}
                  type="button"
                  className={future ? 'heat-cell is-future' : 'heat-cell'}
                  disabled={future}
                  aria-label={heading.full}
                  title={heading.full}
                  style={{
                    background: intensity ? withAlpha(color, 0.12 + intensity * 0.88) : 'transparent',
                    boxShadow: intensity ? 'none' : `inset 0 0 0 1px ${withAlpha(color, 0.22)}`,
                  }}
                  onClick={() => onDayClick(date, value)}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
