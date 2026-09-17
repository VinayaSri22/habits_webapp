import { useState } from 'react'
import { HabitCard } from '../HabitCard/HabitCard.jsx'
import { NumberEntryModal } from '../common/NumberEntryModal.jsx'
import { getHabitSnapshot } from '../../models/Habit.js'
import { dateRangeEndingOn, formatDayHeading, todayKey } from '../../utils/dateUtils.js'
import './HabitList.css'

const VISIBLE_DAYS = 7

export function HabitList({
  habits,
  archivedHabits = [],
  showArchived,
  onToggle,
  onSetEntry,
  onOpen,
  onReorder,
  onArchive,
  onUnarchive,
  onToggleArchived,
}) {
  const dates = dateRangeEndingOn(VISIBLE_DAYS)
  const [dragId, setDragId] = useState(null)
  const [numberTarget, setNumberTarget] = useState(null)

  const ordered = habits.filter((habit) => !habit.isArchived).sort((a, b) => a.position - b.position)
  const orderedArchived = archivedHabits
    .filter((habit) => habit.isArchived)
    .sort((a, b) => a.position - b.position)

  function move(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= ordered.length) return
    const next = [...ordered]
    const [item] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, item)
    onReorder(next.map((habit) => habit.id))
  }

  return (
    <section
      className="habit-list"
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(event) => {
        event.preventDefault()
        const sourceId = dragId || event.dataTransfer.getData('text/plain')
        const target = event.target.closest('[data-habit-id]')
        const targetId = target?.getAttribute('data-habit-id')
        setDragId(null)
        if (!sourceId || !targetId || sourceId === targetId) return
        const fromIndex = ordered.findIndex((item) => item.id === sourceId)
        const toIndex = ordered.findIndex((item) => item.id === targetId)
        move(fromIndex, toIndex)
      }}
    >
      <div className="habit-grid habit-list-header">
        <span />
        <span className="habit-list-title">Habits</span>
        <span className="score-heading">Score</span>
        {dates.map((date, index) => {
          const heading = formatDayHeading(date)
          const isToday = date === todayKey()
          return (
            <div
              key={date}
              className={`day-slot day-heading${isToday ? ' today' : ''}${index < 2 ? ' is-optional' : ''}${index < 4 ? ' is-mobile-optional' : ''}`}
            >
              <span>{heading.weekday}</span>
              <strong>{heading.day}</strong>
            </div>
          )
        })}
        <span />
      </div>

      {ordered.length === 0 ? (
        <div className="list-empty">
          <strong>No active habits</strong>
          <span>Unarchive a habit or create a new one to keep tracking.</span>
        </div>
      ) : null}

      {ordered.map((habit, index) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          snapshot={getHabitSnapshot(habit)}
          dates={dates}
          canMoveUp={index > 0}
          canMoveDown={index < ordered.length - 1}
          onToggle={(date) => onToggle(habit.id, date)}
          onOpenNumber={(date, value) => setNumberTarget({ habit, date, value })}
          onOpen={() => onOpen(habit)}
          onMoveUp={() => move(index, index - 1)}
          onMoveDown={() => move(index, index + 1)}
          onArchive={() => onArchive(habit.id)}
          onDragStart={(event) => {
            setDragId(habit.id)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', habit.id)
          }}
        />
      ))}

      {orderedArchived.length > 0 ? (
        <section className="archive-section" aria-label="Archived habits">
          <button type="button" className="archive-toggle" onClick={onToggleArchived}>
            <span>{showArchived ? 'Hide archived' : 'Show archived'}</span>
            <strong>{orderedArchived.length}</strong>
          </button>
          {showArchived ? (
            <div className="archived-list">
              {orderedArchived.map((habit) => {
                const snapshot = getHabitSnapshot(habit)
                return (
                  <article key={habit.id} className="archived-row">
                    <button type="button" className="archived-name" onClick={() => onOpen(habit)}>
                      {habit.name}
                    </button>
                    <span>{snapshot.scorePercent}%</span>
                    <button type="button" className="btn btn-ghost" onClick={() => onUnarchive(habit.id)}>
                      Unarchive
                    </button>
                  </article>
                )
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      <NumberEntryModal
        open={Boolean(numberTarget)}
        habit={numberTarget?.habit}
        dateLabel={numberTarget ? formatDayHeading(numberTarget.date).full : ''}
        value={numberTarget?.value}
        onClose={() => setNumberTarget(null)}
        onSave={(value) => {
          if (!numberTarget) return
          onSetEntry(numberTarget.habit.id, numberTarget.date, value)
          setNumberTarget(null)
        }}
      />
    </section>
  )
}
