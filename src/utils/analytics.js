import { SKIP, UNKNOWN, YES_AUTO, YES_MANUAL, fromMillivalue } from '../models/Entry.js'
import { HabitType, NumericalHabitType } from '../models/types.js'
import { addDays, daysBetween, mondayIndex, startOfWeekMonday, todayKey } from './dateUtils.js'

export function isSuccessfulEntry(habit, value) {
  if (habit.type === HabitType.NUMERICAL) {
    if (value === UNKNOWN || value === SKIP) return false
    if (habit.targetType === NumericalHabitType.AT_LEAST) {
      return fromMillivalue(value) >= habit.targetValue
    }
    return fromMillivalue(value) <= habit.targetValue
  }
  return value === YES_MANUAL || value === YES_AUTO
}

export function isManualCompletion(habit, value) {
  if (habit.type === HabitType.NUMERICAL) return isSuccessfulEntry(habit, value)
  return value === YES_MANUAL
}

export const HistorySquare = {
  ON: 'on',
  OFF: 'off',
  GREY: 'grey',
  DIMMED: 'dimmed',
  HATCHED: 'hatched',
}

/**
 * Square state for the calendar history, matching Loop's HistoryCard.
 * Numerical habits use GREY for days with some progress but below target.
 */
export function historySquare(habit, value) {
  if (habit.type === HabitType.NUMERICAL) {
    if (value === UNKNOWN) return HistorySquare.OFF
    if (value === SKIP) return HistorySquare.HATCHED
    return isSuccessfulEntry(habit, value) ? HistorySquare.ON : HistorySquare.GREY
  }

  if (value === YES_MANUAL) return HistorySquare.ON
  if (value === YES_AUTO) return HistorySquare.DIMMED
  if (value === SKIP) return HistorySquare.HATCHED
  return HistorySquare.OFF
}

export function describeSquare(habit, value) {
  if (value === UNKNOWN) return 'no data'
  if (value === SKIP) return 'skipped'
  if (habit.type === HabitType.NUMERICAL) {
    const amount = fromMillivalue(value)
    const unit = habit.unit ? ` ${habit.unit}` : ''
    return `${Number(amount.toFixed(2))}${unit}`
  }
  if (value === YES_MANUAL) return 'completed'
  if (value === YES_AUTO) return 'completed automatically'
  return 'missed'
}

export function countCompletions(habit, computedEntries) {
  return Object.values(computedEntries).filter((entry) => isManualCompletion(habit, entry.value)).length
}

export function weekdayCompletionCounts(habit, computedEntries, fromDate, toDate) {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  let current = fromDate
  while (current <= toDate) {
    const value = computedEntries[current]?.value ?? UNKNOWN
    if (isManualCompletion(habit, value)) {
      counts[mondayIndex(current)] += 1
    }
    current = addDays(current, 1)
  }
  return counts
}

/** Number of Monday-start weeks spanned by [fromDate, toDate], inclusive. */
export function countWeeksBetween(fromDate, toDate) {
  const span = daysBetween(startOfWeekMonday(fromDate), startOfWeekMonday(toDate))
  return Math.floor(span / 7) + 1
}

/**
 * `columns` week columns (oldest first), each 7 days starting Monday.
 * The newest column is `weekOffset` weeks before the week containing `endKey`.
 */
export function buildWeekColumns({ columns, endKey = todayKey(), weekOffset = 0 }) {
  const lastMonday = addDays(startOfWeekMonday(endKey), -weekOffset * 7)
  const firstMonday = addDays(lastMonday, -(columns - 1) * 7)

  return Array.from({ length: columns }, (_, week) => {
    const weekStart = addDays(firstMonday, week * 7)
    return Array.from({ length: 7 }, (_, day) => addDays(weekStart, day))
  })
}

export function scoreSeries(scores, fromDate, toDate) {
  const series = []
  let current = fromDate
  while (current <= toDate) {
    series.push({
      date: current,
      value: scores[current]?.value ?? 0,
    })
    current = addDays(current, 1)
  }
  return series
}

export function firstKnownDate(computedEntries, fallback = todayKey()) {
  const dates = Object.keys(computedEntries).sort()
  return dates[0] ?? fallback
}
