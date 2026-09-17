import { formatShortDate } from '../../utils/dateUtils.js'
import { streakLength } from '../../models/Streak.js'

export function StreakStats({ currentStreak, bestStreak, completions, color }) {
  const current = currentStreak ? streakLength(currentStreak) : 0
  const best = bestStreak ? streakLength(bestStreak) : 0

  const items = [
    {
      label: 'Current streak',
      value: current,
      hint: currentStreak ? `${formatShortDate(currentStreak.start)} – ${formatShortDate(currentStreak.end)}` : 'No active streak',
    },
    {
      label: 'Best streak',
      value: best,
      hint: bestStreak ? `${formatShortDate(bestStreak.start)} – ${formatShortDate(bestStreak.end)}` : 'Complete a day to start',
    },
    {
      label: 'Completions',
      value: completions,
      hint: 'Manual check-ins counted',
    },
  ]

  return (
    <div className="stat-grid">
      {items.map((item) => (
        <article key={item.label} className="stat-card">
          <p className="stat-label">{item.label}</p>
          <p className="stat-value" style={{ color }}>
            {item.value}
            {item.label !== 'Completions' ? <span>d</span> : null}
          </p>
          <p className="stat-hint">{item.hint}</p>
        </article>
      ))}
    </div>
  )
}
