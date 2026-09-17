import { addDays } from '../utils/dateUtils.js'
import { UNKNOWN, YES_AUTO, YES_MANUAL, getEntriesByInterval } from './Entry.js'
import { NumericalHabitType } from './types.js'

export function createStreak(start, end) {
  return {
    start,
    end,
    get length() {
      return streakLength(this)
    },
  }
}

export function streakLength({ start, end }) {
  const from = new Date(`${start}T00:00:00`)
  const to = new Date(`${end}T00:00:00`)
  return Math.round((to - from) / (24 * 60 * 60 * 1000)) + 1
}

export function compareStreakLonger(a, b) {
  const lengthDiff = streakLength(a) - streakLength(b)
  if (lengthDiff !== 0) return lengthDiff
  return a.end < b.end ? -1 : a.end > b.end ? 1 : 0
}

export function compareStreakNewer(a, b) {
  return a.end < b.end ? -1 : a.end > b.end ? 1 : 0
}

function isSuccessfulEntry(entry, { isNumerical, targetValue, targetType }) {
  const { value } = entry
  if (isNumerical) {
    if (targetType === NumericalHabitType.AT_LEAST) return value / 1000 >= targetValue
    return value !== UNKNOWN && value / 1000 <= targetValue
  }
  return value > 0
}

/**
 * Port of Loop StreakList.recompute.
 * computedEntries is newest-first from getEntriesByInterval.
 */
export function recomputeStreaks({
  computedEntries,
  fromDate,
  toDate,
  isNumerical,
  targetValue,
  targetType,
}) {
  const timestamps = getEntriesByInterval(computedEntries, fromDate, toDate)
    .filter((entry) => isSuccessfulEntry(entry, { isNumerical, targetValue, targetType }))
    .map((entry) => entry.date)

  if (timestamps.length === 0) return []

  const streaks = []
  let begin = timestamps[0]
  let end = timestamps[0]

  for (let i = 1; i < timestamps.length; i += 1) {
    const current = timestamps[i]
    if (current === addDays(begin, -1)) {
      begin = current
    } else {
      streaks.push({ start: begin, end })
      begin = current
      end = current
    }
  }
  streaks.push({ start: begin, end })
  return streaks
}

export function getBestStreaks(streaks, limit) {
  return [...streaks]
    .sort((a, b) => compareStreakLonger(b, a))
    .slice(0, limit)
    .sort((a, b) => compareStreakNewer(b, a))
}

export function getCurrentStreak(streaks, today) {
  const coveringToday = streaks.find(
    (streak) => streak.start <= today && today <= streak.end,
  )
  if (coveringToday) return coveringToday

  const yesterday = addDays(today, -1)
  return streaks.find((streak) => streak.start <= yesterday && yesterday <= streak.end) ?? null
}

export function isCompletedCheckmark(value) {
  return value === YES_MANUAL || value === YES_AUTO
}
