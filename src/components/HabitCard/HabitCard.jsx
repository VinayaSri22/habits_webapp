import { NO, SKIP, UNKNOWN, YES_AUTO, YES_MANUAL, fromMillivalue } from '../../models/Entry.js'
import { HabitType } from '../../models/types.js'
import { describeFrequency } from '../../models/Frequency.js'
import { getHabitColor } from '../../utils/colors.js'
import { formatDayHeading } from '../../utils/dateUtils.js'
import './HabitCard.css'

function numericLabel(value) {
  if (value === UNKNOWN) return ''
  if (value === SKIP) return '⊘'
  const amount = fromMillivalue(value)
  if (Number.isInteger(amount)) return String(amount)
  return String(Number(amount.toFixed(2)))
}

function CheckIcon({ value, color }) {
  if (value === YES_MANUAL) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill={color} />
        <path d="M7.5 12.5 10.5 15.5 16.5 8.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (value === YES_AUTO) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2" />
        <path d="M8 12.5 10.5 15 16 9" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (value === SKIP) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 12h10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    )
  }
  if (value === NO) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 8l8 8M16 8l-8 8" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function stateName(value, isNumerical) {
  if (isNumerical) {
    if (value === UNKNOWN) return 'no value'
    if (value === SKIP) return 'skipped'
    return numericLabel(value)
  }
  if (value === YES_MANUAL) return 'yes'
  if (value === YES_AUTO) return 'auto yes'
  if (value === SKIP) return 'skipped'
  if (value === NO) return 'no'
  return 'unknown'
}

export function HabitCard({
  habit,
  snapshot,
  dates,
  canMoveUp,
  canMoveDown,
  onToggle,
  onOpenNumber,
  onOpen,
  onMoveUp,
  onMoveDown,
  onArchive,
  onDragStart,
}) {
  const color = getHabitColor(habit.colorIndex).hex
  const isNumerical = habit.type === HabitType.NUMERICAL

  return (
    <article
      className="habit-grid habit-card"
      data-habit-id={habit.id}
    >
      <button
        type="button"
        className="drag-handle"
        draggable
        aria-label={`Reorder ${habit.name}`}
        title="Drag to reorder"
        onDragStart={onDragStart}
      >
        ⋮⋮
      </button>

      <div className="habit-meta">
        <button type="button" className="habit-name" onClick={onOpen}>
          <span className="habit-pip" style={{ background: color }} />
          {habit.name}
        </button>
        <p>
          {describeFrequency(habit.frequency)}
          {isNumerical ? ` · ${habit.targetValue}${habit.unit ? ` ${habit.unit}` : ''}` : ''}
        </p>
      </div>

      <div className="score-pill" style={{ color, background: `${color}22` }}>
        {snapshot.scorePercent}%
      </div>

      {dates.map((date, index) => {
        const value = snapshot.computedEntries[date]?.value ?? UNKNOWN
        const heading = formatDayHeading(date)
        return (
          <button
            key={date}
            type="button"
            className={`day-slot check-button${index < 2 ? ' is-optional' : ''}${index < 4 ? ' is-mobile-optional' : ''}`}
            aria-label={`${habit.name}, ${heading.full}: ${stateName(value, isNumerical)}`}
            onClick={() => (isNumerical ? onOpenNumber(date, value) : onToggle(date))}
          >
            {isNumerical && value !== UNKNOWN && value !== SKIP ? (
              <span className="numeric-value" style={{ color }}>
                {numericLabel(value)}
              </span>
            ) : (
              <CheckIcon value={value} color={color} />
            )}
          </button>
        )
      })}

      <div className="habit-actions">
        {/* <button type="button" className="archive-button" onClick={onArchive} aria-label={`Archive ${habit.name}`}>
          Archive
        </button> */}
        <div className="habit-move">
          <button type="button" className="icon-button" disabled={!canMoveUp} onClick={onMoveUp} aria-label="Move up">
            ↑
          </button>
          <button type="button" className="icon-button" disabled={!canMoveDown} onClick={onMoveDown} aria-label="Move down">
            ↓
          </button>
        </div>
      </div>
    </article>
  )
}
