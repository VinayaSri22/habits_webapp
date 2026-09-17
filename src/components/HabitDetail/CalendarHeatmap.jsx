import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { UNKNOWN } from '../../models/Entry.js'
import { HabitType } from '../../models/types.js'
import {
  HistorySquare,
  buildWeekColumns,
  countWeeksBetween,
  describeSquare,
  historySquare,
} from '../../utils/analytics.js'
import { readableTextOn, withAlpha } from '../../utils/colors.js'
import {
  formatDayHeading,
  formatMonthYear,
  parseDateKey,
  todayKey,
  weekdayLabelsMondayFirst,
} from '../../utils/dateUtils.js'

const MIN_COLUMNS = 4

function squareStyle(square, color) {
  switch (square) {
    case HistorySquare.ON:
      return { backgroundColor: color, color: readableTextOn(color) }
    case HistorySquare.DIMMED:
      return { backgroundColor: withAlpha(color, 0.5), color: 'var(--color-text)' }
    case HistorySquare.HATCHED:
      return {
        backgroundColor: withAlpha(color, 0.5),
        backgroundImage:
          'repeating-linear-gradient(45deg, transparent 0 4px, var(--color-surface) 4px 5px)',
        color: 'var(--color-text)',
      }
    case HistorySquare.GREY:
      return { backgroundColor: 'var(--color-text-muted)', color: 'var(--color-surface)' }
    default:
      return { backgroundColor: 'var(--heat-off)', color: 'var(--color-text-muted)' }
  }
}

/** Month name above a column, printed only when the month or year changes. */
function monthLabels(weeks) {
  let lastMonth = ''
  let lastYear = ''

  return weeks.map((week) => {
    const date = parseDateKey(week[0])
    const month = date.toLocaleDateString(undefined, { month: 'short' })
    const year = String(date.getFullYear())

    if (month !== lastMonth) {
      const label = lastYear && year !== lastYear ? `${month} ${year}` : month
      lastMonth = month
      lastYear = year
      return label
    }
    if (year !== lastYear) {
      lastYear = year
      return year
    }
    return ''
  })
}

/** How many week columns fit the panel, based on the CSS cell sizing. */
function useFittedColumns(ref) {
  const [columns, setColumns] = useState(MIN_COLUMNS)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const measure = () => {
      const styles = getComputedStyle(node)
      const cell = Number.parseFloat(styles.getPropertyValue('--heat-cell')) || 28
      const gap = Number.parseFloat(styles.getPropertyValue('--heat-gap')) || 3
      const label = Number.parseFloat(styles.getPropertyValue('--heat-label')) || 32
      const available = node.clientWidth - label - gap
      setColumns(Math.max(MIN_COLUMNS, Math.floor((available + gap) / (cell + gap))))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])

  return columns
}

export function CalendarHeatmap({ habit, computedEntries, color, oldestDate, onDayClick }) {
  const containerRef = useRef(null)
  const columns = useFittedColumns(containerRef)
  const [weekOffset, setWeekOffset] = useState(0)

  const today = todayKey()
  const totalWeeks = countWeeksBetween(oldestDate, today)
  const maxOffset = Math.max(0, totalWeeks - columns)
  // Resizing changes how many weeks fit, which can strand the stored page.
  const offset = Math.min(weekOffset, maxOffset)
  const weeks = buildWeekColumns({ columns, endKey: today, weekOffset: offset })
  const weekdays = weekdayLabelsMondayFirst()
  const months = monthLabels(weeks)
  const isNumerical = habit.type === HabitType.NUMERICAL

  const step = Math.max(1, columns - 1)
  const rangeLabel = `${formatMonthYear(weeks[0][0])} – ${formatMonthYear(weeks.at(-1)[6])}`

  return (
    <div className="heatmap" ref={containerRef}>
      <div className="heatmap-nav">
        <span className="heatmap-range">{rangeLabel}</span>
        <div className="heatmap-nav-buttons">
          {offset > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={() => setWeekOffset(0)}>
              Today
            </button>
          ) : null}
          <button
            type="button"
            className="icon-button"
            aria-label="Earlier weeks"
            disabled={offset >= maxOffset}
            onClick={() => setWeekOffset(Math.min(maxOffset, offset + step))}
          >
            ←
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Later weeks"
            disabled={offset === 0}
            onClick={() => setWeekOffset(Math.max(0, offset - step))}
          >
            →
          </button>
        </div>
      </div>

      <div className="heatmap-grid" style={{ '--heat-columns': columns }}>
        <span className="heatmap-corner" />
        {months.map((label, index) => (
          <span key={weeks[index][0]} className="heatmap-month">
            {label}
          </span>
        ))}

        {weekdays.map((weekday, row) => (
          <Fragment key={weekday}>
            <span className="heatmap-weekday">{weekday}</span>
            {weeks.map((week) => {
              const date = week[row]
              const heading = formatDayHeading(date)

              if (date > today) {
                return <span key={date} className="heat-cell is-future" aria-hidden="true" />
              }

              const entry = computedEntries[date]
              const value = entry?.value ?? UNKNOWN
              const square = historySquare(habit, value)

              return (
                <button
                  key={date}
                  type="button"
                  className="heat-cell"
                  style={squareStyle(square, color)}
                  aria-label={`${heading.full}: ${describeSquare(habit, value)}`}
                  title={`${heading.full} — ${describeSquare(habit, value)}`}
                  onClick={() => onDayClick(date, value)}
                >
                  {heading.day}
                  {entry?.notes ? <span className="heat-note" aria-hidden="true" /> : null}
                </button>
              )
            })}
          </Fragment>
        ))}
      </div>

      <ul className="heatmap-legend">
        <li>
          <span className="legend-swatch" style={squareStyle(HistorySquare.ON, color)} />
          Completed
        </li>
        {isNumerical ? (
          <li>
            <span className="legend-swatch" style={squareStyle(HistorySquare.GREY, color)} />
            Below target
          </li>
        ) : (
          <li>
            <span className="legend-swatch" style={squareStyle(HistorySquare.DIMMED, color)} />
            Auto
          </li>
        )}
        <li>
          <span className="legend-swatch" style={squareStyle(HistorySquare.HATCHED, color)} />
          Skipped
        </li>
        <li>
          <span className="legend-swatch" style={squareStyle(HistorySquare.OFF, color)} />
          Missed
        </li>
      </ul>
    </div>
  )
}
