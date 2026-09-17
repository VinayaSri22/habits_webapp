import { DEFAULT_HABIT_COLOR } from '../utils/colors.js'
import { addDays, todayKey } from '../utils/dateUtils.js'
import {
  NO,
  UNKNOWN,
  nextToggleValue,
  createEntry,
  entriesByDateFromList,
  recomputeComputedEntries,
} from './Entry.js'
import { FrequencyPresets } from './Frequency.js'
import { getScore, recomputeScores } from './Score.js'
import { getBestStreaks, getCurrentStreak, recomputeStreaks } from './Streak.js'
import { HabitType, NumericalHabitType } from './types.js'

export { HabitType, NumericalHabitType }

export function createHabit(partial = {}) {
  return {
    id: partial.id ?? crypto.randomUUID(),
    uuid: partial.uuid ?? crypto.randomUUID().replaceAll('-', ''),
    name: partial.name ?? '',
    description: partial.description ?? '',
    question: partial.question ?? '',
    colorIndex: partial.colorIndex ?? DEFAULT_HABIT_COLOR,
    type: partial.type ?? HabitType.YES_NO,
    frequency: partial.frequency ?? { ...FrequencyPresets.DAILY },
    targetType: partial.targetType ?? NumericalHabitType.AT_LEAST,
    targetValue: partial.targetValue ?? 0,
    unit: partial.unit ?? '',
    isArchived: partial.isArchived ?? false,
    position: partial.position ?? 0,
    reminder: partial.reminder ?? null,
    createdAt: partial.createdAt ?? new Date().toISOString(),
    entries: partial.entries ?? [],
  }
}

export function isNumericalHabit(habit) {
  return habit.type === HabitType.NUMERICAL
}

export function originalEntriesByDate(habit) {
  return entriesByDateFromList(habit.entries)
}

export function setHabitEntry(habit, date, value, notes = '') {
  const nextEntries = habit.entries.filter((entry) => entry.date !== date)
  if (value !== UNKNOWN || notes) {
    nextEntries.push(createEntry(date, value, notes))
  }
  nextEntries.sort((a, b) => (a.date < b.date ? 1 : -1))
  return { ...habit, entries: nextEntries }
}

export function recomputeHabit(habit, { today = todayKey() } = {}) {
  const isNumerical = isNumericalHabit(habit)
  const original = originalEntriesByDate(habit)
  const computedEntries = recomputeComputedEntries(original, habit.frequency, isNumerical)
  const known = Object.keys(computedEntries).sort()
  const toDate = addDays(today, 30)
  let fromDate = known[0] ?? today
  if (fromDate > toDate) fromDate = toDate

  const scores = recomputeScores({
    frequency: habit.frequency,
    isNumerical,
    numericalHabitType: habit.targetType,
    targetValue: habit.targetValue,
    computedEntries,
    fromDate,
    toDate,
  })

  const streaks = recomputeStreaks({
    computedEntries,
    fromDate,
    toDate,
    isNumerical,
    targetValue: habit.targetValue,
    targetType: habit.targetType,
  })

  return { computedEntries, scores, streaks }
}

export function isCompletedToday(habit, computedEntries, today = todayKey()) {
  const value = computedEntries[today]?.value ?? UNKNOWN
  if (isNumericalHabit(habit)) {
    if (habit.targetType === NumericalHabitType.AT_LEAST) {
      return value / 1000 >= habit.targetValue
    }
    return false
  }
  return value !== NO && value !== UNKNOWN
}

export function isEnteredToday(computedEntries, today = todayKey()) {
  return (computedEntries[today]?.value ?? UNKNOWN) !== UNKNOWN
}

export function getHabitSnapshot(habit, { today = todayKey() } = {}) {
  const { computedEntries, scores, streaks } = recomputeHabit(habit, { today })
  const todayScore = getScore(scores, today)
  return {
    habit,
    computedEntries,
    scores,
    streaks,
    todayScore,
    scorePercent: Math.round(todayScore.value * 100),
    currentStreak: getCurrentStreak(streaks, today),
    bestStreak: getBestStreaks(streaks, 1)[0] ?? null,
    isCompletedToday: isCompletedToday(habit, computedEntries, today),
    isEnteredToday: isEnteredToday(computedEntries, today),
  }
}

export function cycleYesNoEntry(habit, date, options) {
  const current = habit.entries.find((entry) => entry.date === date)
  const nextValue = nextToggleValue(current?.value ?? UNKNOWN, options)
  return setHabitEntry(habit, date, nextValue, current?.notes ?? '')
}
