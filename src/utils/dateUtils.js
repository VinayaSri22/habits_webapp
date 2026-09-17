const DAY_MS = 24 * 60 * 60 * 1000

/** Local calendar date as YYYY-MM-DD (avoids UTC timezone shifts). */
export function toDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function todayKey() {
  return toDateKey(new Date())
}

export function addDays(dateKey, days) {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function daysBetween(fromKey, toKey) {
  const from = parseDateKey(fromKey)
  const to = parseDateKey(toKey)
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

export function minDateKey(a, b) {
  return a < b ? a : b
}

export function maxDateKey(a, b) {
  return a > b ? a : b
}

export function weekdayIndex(dateKey) {
  return parseDateKey(dateKey).getDay()
}

export function monthLength(dateKey) {
  const date = parseDateKey(dateKey)
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

export function isLastDayOfMonth(dateKey) {
  const date = parseDateKey(dateKey)
  return date.getDate() === monthLength(dateKey)
}

/** Oldest → newest, inclusive of `endKey` (defaults to today). */
export function dateRangeEndingOn(count, endKey = todayKey()) {
  return Array.from({ length: count }, (_, index) => addDays(endKey, index - count + 1))
}

export function formatDayHeading(dateKey) {
  const date = parseDateKey(dateKey)
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
    day: String(date.getDate()),
    full: date.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }),
  }
}

export function formatShortDate(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function formatMonthYear(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })
}

/** Monday-start week containing `dateKey`. */
export function startOfWeekMonday(dateKey) {
  const date = parseDateKey(dateKey)
  const offset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - offset)
  return toDateKey(date)
}

export function mondayIndex(dateKey) {
  return (weekdayIndex(dateKey) + 6) % 7
}

export function weekdayLabelsMondayFirst() {
  const monday = parseDateKey('2026-01-05')
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + index)
    return date.toLocaleDateString(undefined, { weekday: 'short' })
  })
}
