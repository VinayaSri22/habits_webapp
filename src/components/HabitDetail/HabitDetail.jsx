import { useMemo, useState } from 'react'
import { NumberEntryModal } from '../common/NumberEntryModal.jsx'
import { describeFrequency } from '../../models/Frequency.js'
import { getHabitSnapshot, HabitType } from '../../models/Habit.js'
import {
  countCompletions,
  firstKnownDate,
  scoreSeries,
  weekdayCompletionCounts,
} from '../../utils/analytics.js'
import { getHabitColor } from '../../utils/colors.js'
import { addDays, formatDayHeading, todayKey } from '../../utils/dateUtils.js'
import { CalendarHeatmap } from './CalendarHeatmap.jsx'
import { ScoreChart } from './ScoreChart.jsx'
import { StreakStats } from './StreakStats.jsx'
import { WeekdayChart } from './WeekdayChart.jsx'
import './HabitDetail.css'

const RANGES = [
  { id: 30, label: '30d' },
  { id: 90, label: '90d' },
  { id: 180, label: '180d' },
  { id: 0, label: 'All' },
]

export function HabitDetail({ habit, onBack, onEdit, onToggle, onSetEntry }) {
  const snapshot = getHabitSnapshot(habit)
  const color = getHabitColor(habit.colorIndex).hex
  const today = todayKey()
  const [range, setRange] = useState(90)
  const [numberTarget, setNumberTarget] = useState(null)
  const isNumerical = habit.type === HabitType.NUMERICAL

  const knownFrom = firstKnownDate(snapshot.computedEntries, today)
  const fromDate = range === 0 ? knownFrom : addDays(today, -(range - 1))

  const series = useMemo(
    () => scoreSeries(snapshot.scores, fromDate > today ? today : fromDate, today),
    [snapshot.scores, fromDate, today],
  )
  const weekdayCounts = weekdayCompletionCounts(habit, snapshot.computedEntries, fromDate, today)
  const completions = countCompletions(habit, snapshot.computedEntries)

  function handleDay(date, value) {
    if (isNumerical) {
      setNumberTarget({ date, value })
      return
    }
    onToggle(habit.id, date)
  }

  return (
    <article className="detail">
      <div className="detail-nav">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Habits
        </button>
        <button type="button" className="btn btn-primary" onClick={onEdit}>
          Edit
        </button>
      </div>

      <header className="detail-hero">
        <span className="detail-pip" style={{ background: color }} />
        <div>
          <h2>{habit.name}</h2>
          <p>
            {describeFrequency(habit.frequency)}
            {isNumerical ? ` · ${habit.targetValue}${habit.unit ? ` ${habit.unit}` : ''}` : ''}
          </p>
          {habit.question ? <p className="detail-question">{habit.question}</p> : null}
        </div>
        <div className="detail-score" style={{ color, background: `${color}22` }}>
          {snapshot.scorePercent}%
        </div>
      </header>

      <StreakStats
        currentStreak={snapshot.currentStreak}
        bestStreak={snapshot.bestStreak}
        completions={completions}
        color={color}
      />

      <section className="panel">
        <div className="panel-head">
          <h3>Score</h3>
          <div className="segmented">
            {RANGES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={range === item.id}
                onClick={() => setRange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <ScoreChart series={series} color={color} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Calendar</h3>
          <p>Tap a day to check in</p>
        </div>
        <CalendarHeatmap
          key={habit.id}
          habit={habit}
          computedEntries={snapshot.computedEntries}
          color={color}
          oldestDate={knownFrom}
          onDayClick={handleDay}
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h3>Day of week</h3>
          <p>Manual completions in this range</p>
        </div>
        <WeekdayChart counts={weekdayCounts} color={color} />
      </section>

      <NumberEntryModal
        open={Boolean(numberTarget)}
        habit={habit}
        dateLabel={numberTarget ? formatDayHeading(numberTarget.date).full : ''}
        value={numberTarget?.value}
        onClose={() => setNumberTarget(null)}
        onSave={(value) => {
          if (!numberTarget) return
          onSetEntry(habit.id, numberTarget.date, value)
          setNumberTarget(null)
        }}
      />
    </article>
  )
}
