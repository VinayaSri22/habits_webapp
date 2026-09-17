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
