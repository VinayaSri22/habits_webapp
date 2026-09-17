export const FrequencyPresets = {
  DAILY: { numerator: 1, denominator: 1 },
  THREE_TIMES_PER_WEEK: { numerator: 3, denominator: 7 },
  TWO_TIMES_PER_WEEK: { numerator: 2, denominator: 7 },
  WEEKLY: { numerator: 1, denominator: 7 },
}

/**
 * Frequency is repetitions / interval length.
 * Example: 3 times in 8 days → 3/8 = 0.375.
 * Equal numerator and denominator collapse to daily (1/1), matching Loop.
 */
export function createFrequency(numerator, denominator) {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new Error('Frequency numerator and denominator must be integers')
  }
  if (numerator <= 0 || denominator <= 0) {
    throw new Error('Frequency numerator and denominator must be positive')
  }

  if (numerator === denominator) {
    return { numerator: 1, denominator: 1 }
  }

  return { numerator, denominator }
}

export function frequencyToDouble({ numerator, denominator }) {
  return numerator / denominator
}

export function isDailyFrequency(frequency) {
  return frequency.numerator === 1 && frequency.denominator === 1
}

export function describeFrequency({ numerator, denominator }) {
  if (numerator === 1 && denominator === 1) return 'Every day'
  if (denominator === 7) {
    return numerator === 1 ? 'Once a week' : `${numerator} times a week`
  }
  if (denominator === 30 || denominator === 31) {
    return numerator === 1 ? 'Once a month' : `${numerator} times a month`
  }
  if (numerator === 1) return `Every ${denominator} days`
  return `${numerator} times every ${denominator} days`
}
