import { useState } from 'react'
import { HabitCard } from '../HabitCard/HabitCard.jsx'
import { NumberEntryModal } from '../common/NumberEntryModal.jsx'
import { getHabitSnapshot } from '../../models/Habit.js'
import { dateRangeEndingOn, formatDayHeading, todayKey } from '../../utils/dateUtils.js'
import './HabitList.css'

const VISIBLE_DAYS = 7

export function HabitList({ habits, onToggle, onSetEntry, onOpen, onReorder }) {
  const dates = dateRangeEndingOn(VISIBLE_DAYS)
  const [dragId, setDragId] = useState(null)
  const [numberTarget, setNumberTarget] = useState(null)

  const ordered = habits
    .filter((habit) => !habit.isArchived)
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
              className={`day-slot day-heading${isToday ? ' today' : ''}${index < 2 ? ' is-optional' : ''}`}
            >
              <span>{heading.weekday}</span>
              <strong>{heading.day}</strong>
            </div>
          )
        })}
        <span />
      </div>

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
          onDragStart={(event) => {
            setDragId(habit.id)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', habit.id)
          }}
        />
      ))}

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
