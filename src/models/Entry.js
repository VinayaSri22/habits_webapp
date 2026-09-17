import { addDays, daysBetween, isLastDayOfMonth, maxDateKey, minDateKey, monthLength } from '../utils/dateUtils.js'

/** Habit is not applicable on this day. */
export const SKIP = 3
/** User completed a yes/no habit. */
export const YES_MANUAL = 2
/** Auto-filled success for non-daily yes/no habits. */
export const YES_AUTO = 1
/** User missed a day they were expected to complete. */
export const NO = 0
/** No data for this day. */
export const UNKNOWN = -1

export const EntryValue = {
  SKIP,
  YES_MANUAL,
  YES_AUTO,
  NO,
  UNKNOWN,
}

export function createEntry(date, value, notes = '') {
  return { date, value, notes }
}

export function formatEntryValue(value) {
  switch (value) {
    case YES_MANUAL:
      return 'YES_MANUAL'
    case YES_AUTO:
      return 'YES_AUTO'
    case NO:
      return 'NO'
    case SKIP:
      return 'SKIP'
    case UNKNOWN:
      return 'UNKNOWN'
    default:
      return String(value)
  }
}

/** Yes/No toggle cycle from Loop: Yes → Skip → No → Unknown → Yes. */
export function nextToggleValue(value, { skipEnabled = true, questionMarksEnabled = true } = {}) {
  switch (value) {
    case YES_AUTO:
    case YES_MANUAL:
      return skipEnabled ? SKIP : NO
    case SKIP:
      return NO
    case NO:
      return questionMarksEnabled ? UNKNOWN : YES_MANUAL
    case UNKNOWN:
    default:
      return YES_MANUAL
  }
}

export function millivalue(numericValue) {
  return Math.round(numericValue * 1000)
}

export function fromMillivalue(value) {
  return value / 1000
}

export function getEntry(entriesByDate, date) {
  return entriesByDate[date] ?? createEntry(date, UNKNOWN)
}

/** Newest-first, inclusive endpoints — same order as Loop's EntryList.getByInterval. */
export function getEntriesByInterval(entriesByDate, fromDate, toDate) {
  if (fromDate > toDate) return []

  const result = []
  let current = toDate
  while (current >= fromDate) {
    result.push(getEntry(entriesByDate, current))
    current = addDays(current, -1)
  }
  return result
}

export function knownEntries(entries) {
  return Object.values(entries)
    .filter((entry) => entry.value !== UNKNOWN || entry.notes)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function entriesByDateFromList(entryList) {
  return Object.fromEntries(entryList.map((entry) => [entry.date, entry]))
}

/**
 * For yes/no habits, fill YES_AUTO days from frequency intervals.
 * Numerical habits copy original entries as-is.
 */
export function recomputeComputedEntries(originalEntries, frequency, isNumerical) {
  const original = knownEntries(originalEntries)
  if (isNumerical) {
    return entriesByDateFromList(original)
  }

  const intervals = buildIntervals(frequency, original)
  snapIntervalsTogether(intervals)
  const computed = buildEntriesFromInterval(original, intervals)
  return entriesByDateFromList(
    computed.filter((entry) => entry.value !== UNKNOWN || entry.notes),
  )
}

function buildIntervals(frequency, entries) {
  const filtered = entries.filter((entry) => entry.value === YES_MANUAL)
  const { numerator, denominator } = frequency
  const intervals = []

  for (let i = numerator - 1; i < filtered.length; i += 1) {
    const begin = filtered[i].date
    const center = filtered[i - numerator + 1].date
    let size = denominator

    if (denominator === 30 || denominator === 31) {
      size = isLastDayOfMonth(begin) ? monthLength(addDays(begin, 1)) : monthLength(begin)
    }

    if (daysBetween(begin, center) < size) {
      intervals.push({
        begin,
        center,
        end: addDays(begin, size - 1),
      })
    }
  }

  return intervals
}

function snapIntervalsTogether(intervals) {
  for (let i = 1; i < intervals.length; i += 1) {
    const current = intervals[i]
    const next = intervals[i - 1]
    const gapNextToCurrent = daysBetween(next.begin, current.end)
    const gapCenterToEnd = daysBetween(current.center, current.end)

    if (gapNextToCurrent >= 0) {
      const shift = Math.min(gapCenterToEnd, gapNextToCurrent + 1)
      intervals[i] = {
        begin: addDays(current.begin, -shift),
        center: current.center,
        end: addDays(current.end, -shift),
      }
    }
  }
}

function buildEntriesFromInterval(original, intervals) {
  if (original.length === 0) return []

  let from = original[0].date
  let to = original[0].date

  for (const entry of original) {
    from = minDateKey(from, entry.date)
    to = maxDateKey(to, entry.date)
  }
  for (const interval of intervals) {
    from = minDateKey(from, interval.begin)
    to = maxDateKey(to, interval.end)
  }

  const byDate = {}
  let current = to
  while (current >= from) {
    byDate[current] = createEntry(current, UNKNOWN)
    current = addDays(current, -1)
  }

  for (const interval of intervals) {
    current = interval.end
    while (current >= interval.begin) {
      byDate[current] = createEntry(current, YES_AUTO)
      current = addDays(current, -1)
    }
  }

  for (const entry of original) {
    const existing = byDate[entry.date]
    const value =
      existing.value === UNKNOWN || entry.value === SKIP || entry.value === YES_MANUAL
        ? entry.value
        : YES_AUTO
    byDate[entry.date] = createEntry(entry.date, value, entry.notes)
  }

  return Object.values(byDate)
}
