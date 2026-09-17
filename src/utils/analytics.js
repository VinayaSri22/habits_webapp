import { NO, SKIP, UNKNOWN, YES_AUTO, YES_MANUAL, fromMillivalue } from '../models/Entry.js'
import { HabitType, NumericalHabitType } from '../models/types.js'
import { addDays, mondayIndex, startOfWeekMonday, todayKey } from './dateUtils.js'

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

export function heatmapIntensity(habit, value) {
  if (value === UNKNOWN) return 0
  if (value === SKIP) return 0.15
  if (habit.type === HabitType.NUMERICAL) {
    if (habit.targetValue > 0) {
      return Math.min(1, Math.max(0.12, fromMillivalue(Math.max(value, 0)) / habit.targetValue))
    }
    return value > 0 ? 1 : 0.12
  }
  if (value === YES_MANUAL) return 1
  if (value === YES_AUTO) return 0.45
  if (value === NO) return 0.22
  return 0
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

export function buildHeatmapWeeks(weekCount, endKey = todayKey()) {
  const thisMonday = startOfWeekMonday(endKey)
  const startMonday = addDays(thisMonday, -(weekCount - 1) * 7)
  return Array.from({ length: weekCount }, (_, week) => {
    const weekStart = addDays(startMonday, week * 7)
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
