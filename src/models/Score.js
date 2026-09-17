import { addDays, daysBetween } from '../utils/dateUtils.js'
import { SKIP, YES_MANUAL, getEntriesByInterval } from './Entry.js'
import { frequencyToDouble } from './Frequency.js'
import { NumericalHabitType } from './types.js'

/**
 * Loop's exponential smoothing formula:
 * score = previousScore × multiplier + checkmarkValue × (1 − multiplier)
 * where multiplier = 0.5 ^ (√frequency / 13.0)
 */
export function computeScore(frequency, previousScore, checkmarkValue) {
  const multiplier = 0.5 ** (Math.sqrt(frequency) / 13.0)
  return previousScore * multiplier + checkmarkValue * (1 - multiplier)
}

export function scoreToPercent(score) {
  return Math.round(score * 100)
}

/**
 * Recomputes one score per day in [fromDate, toDate], oldest → newest.
 * Port of Loop ScoreList.recompute.
 */
export function recomputeScores({
  frequency,
  isNumerical,
  numericalHabitType,
  targetValue,
  computedEntries,
  fromDate,
  toDate,
}) {
  const scores = {}
  if (fromDate > toDate) return scores

  let rollingSum = 0
  let { numerator, denominator } = frequency
  const freq = frequencyToDouble(frequency)
  const values = getEntriesByInterval(computedEntries, fromDate, toDate).map((entry) => entry.value)
  const isAtMost = numericalHabitType === NumericalHabitType.AT_MOST

  if (!isNumerical && freq < 1) {
    numerator *= 2
    denominator *= 2
  }

  let previousValue = isNumerical && isAtMost ? 1 : 0

  for (let i = 0; i < values.length; i += 1) {
    const offset = values.length - i - 1

    if (isNumerical) {
      rollingSum += Math.max(0, values[offset])
      if (offset + denominator < values.length) {
        rollingSum -= Math.max(0, values[offset + denominator])
      }

      const normalizedRollingSum = rollingSum / 1000
      if (values[offset] !== SKIP) {
        let percentageCompleted
        if (!isAtMost) {
          percentageCompleted = targetValue > 0 ? Math.min(1, normalizedRollingSum / targetValue) : 1
        } else if (targetValue > 0) {
          percentageCompleted = Math.min(
            1,
            Math.max(0, 1 - (normalizedRollingSum - targetValue) / targetValue),
          )
        } else {
          percentageCompleted = normalizedRollingSum > 0 ? 0 : 1
        }
        previousValue = computeScore(freq, previousValue, percentageCompleted)
      }
    } else {
      if (values[offset] === YES_MANUAL) rollingSum += 1
      if (offset + denominator < values.length && values[offset + denominator] === YES_MANUAL) {
        rollingSum -= 1
      }
      if (values[offset] !== SKIP) {
        const percentageCompleted = Math.min(1, rollingSum / numerator)
        previousValue = computeScore(freq, previousValue, percentageCompleted)
      }
    }

    const timestamp = addDays(fromDate, i)
    scores[timestamp] = { date: timestamp, value: previousValue }
  }

  return scores
}

export function getScore(scores, date) {
  return scores[date] ?? { date, value: 0 }
}

export function getScoresByInterval(scores, fromDate, toDate) {
  const result = []
  if (fromDate > toDate) return result

  let current = toDate
  while (current >= fromDate) {
    result.push(getScore(scores, current))
    current = addDays(current, -1)
  }
  return result
}

export function scoreRange(fromDate, toDate) {
  return daysBetween(fromDate, toDate) + 1
}
