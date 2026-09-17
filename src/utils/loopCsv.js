import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate'
import {
  NO,
  SKIP,
  UNKNOWN,
  YES_AUTO,
  YES_MANUAL,
  formatEntryValue,
  knownEntries,
} from '../models/Entry.js'
import { createFrequency } from '../models/Frequency.js'
import { createHabit, getHabitSnapshot, isNumericalHabit } from '../models/Habit.js'
import { getScoresByInterval } from '../models/Score.js'
import { HabitType, NumericalHabitType } from '../models/types.js'
import { colorIndexFromHex, getHabitColor } from './colors.js'
import { csvLine, parseCsv, parseCsvTable } from './csv.js'
import { addDays, daysBetween, minDateKey, todayKey } from './dateUtils.js'

const NAMED_VALUES = {
  YES_MANUAL,
  YES_AUTO,
  NO,
  SKIP,
  UNKNOWN,
}

export function sanitizeFilename(name) {
  return name.replace(/[^ a-zA-Z0-9._-]+/g, '').slice(0, 100).trim()
}

export function habitDirName(habit, index) {
  const prefix = String(index + 1).padStart(3, '0')
  return `${prefix} ${sanitizeFilename(habit.name)}/`
}

function parseEntryValue(raw) {
  const token = String(raw ?? '').trim()
  if (!token) return null
  if (token in NAMED_VALUES) return NAMED_VALUES[token]
  if (/^-?\d+$/.test(token)) return Number(token)
  const numeric = Number(token)
  return Number.isFinite(numeric) ? Math.round(numeric) : null
}

function shouldKeepImportedValue(value) {
  return value != null && value !== UNKNOWN && value !== YES_AUTO
}

function normalizePath(path) {
  return path.replaceAll('\\', '/').replace(/^\.\//, '')
}

export function unzipCsvArchive(bytes) {
  const files = unzipSync(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))
  const texts = {}
  for (const [path, data] of Object.entries(files)) {
    if (path.endsWith('/')) continue
    texts[normalizePath(path)] = strFromU8(data)
  }
  return stripCommonRoot(texts)
}

function stripCommonRoot(files) {
  const names = Object.keys(files)
  if (names.length === 0) return files

  const prefix = names.reduce((current, name) => {
    if (current == null) return name.slice(0, name.lastIndexOf('/') + 1)
    let next = ''
    const max = Math.min(current.length, name.length)
    for (let i = 0; i < max; i += 1) {
      if (current[i] !== name[i]) break
      next += current[i]
    }
    const slash = next.lastIndexOf('/')
    return slash >= 0 ? next.slice(0, slash + 1) : ''
  }, null)

  if (!prefix || !names.every((name) => name.startsWith(prefix))) return files
  if (!names.some((name) => name.slice(prefix.length) === 'Habits.csv')) return files

  return Object.fromEntries(names.map((name) => [name.slice(prefix.length), files[name]]))
}

function findHabitsCsv(files) {
  if (files['Habits.csv']) return files['Habits.csv']
  const match = Object.keys(files).find((path) => path.endsWith('/Habits.csv'))
  return match ? files[match] : null
}

function findHabitCheckmarks(files, habit, index) {
  const expected = `${habitDirName(habit, index)}Checkmarks.csv`
  if (files[expected]) return files[expected]
  const prefix = String(index + 1).padStart(3, '0')
  const match = Object.keys(files).find(
    (path) => path.startsWith(`${prefix} `) && path.endsWith('/Checkmarks.csv'),
  )
  return match ? files[match] : null
}

function parseHabitRow(row, index) {
  const type = row.Type === HabitType.NUMERICAL ? HabitType.NUMERICAL : HabitType.YES_NO
  const numerator = Number.parseInt(row.FrequencyNumerator, 10) || 1
  const denominator = Number.parseInt(row.FrequencyDenominator, 10) || 1
  return createHabit({
    name: row.Name?.trim() ?? '',
    question: row.Question ?? '',
    description: row.Description ?? '',
    type,
    frequency: createFrequency(numerator, denominator),
    colorIndex: colorIndexFromHex(row.Color),
    unit: type === HabitType.NUMERICAL ? row.Unit ?? '' : '',
    targetType:
      row['Target Type'] === NumericalHabitType.AT_MOST
        ? NumericalHabitType.AT_MOST
        : NumericalHabitType.AT_LEAST,
    targetValue:
      type === HabitType.NUMERICAL ? Number.parseFloat(row['Target Value']) || 0 : 0,
    isArchived: String(row['Archived?']).toLowerCase() === 'true',
    position: Number.parseInt(row.Position, 10) ? Number.parseInt(row.Position, 10) - 1 : index,
    entries: [],
  })
}

function parseCheckmarksFile(text) {
  return parseCsv(text)
    .map((row) => {
      const value = parseEntryValue(row.Value)
      if (!shouldKeepImportedValue(value)) return null
      return { date: row.Date, value, notes: row.Notes ?? '' }
    })
    .filter(Boolean)
}

function parseCombinedCheckmarks(text, habitNames) {
  const table = parseCsvTable(text)
  if (table.length < 2) return new Map()

  const header = table[0]
  const byName = new Map(habitNames.map((name) => [name, []]))

  for (const cells of table.slice(1)) {
    const date = cells[0]
    habitNames.forEach((name, index) => {
      const column = header.findIndex((title) => title === name)
      const raw = column >= 0 ? cells[column] : cells[index + 1]
      const value = parseEntryValue(raw)
      if (!shouldKeepImportedValue(value)) return
      byName.get(name).push({ date, value, notes: '' })
    })
  }
  return byName
}

export function importLoopCsvFiles(files) {
  const normalized = stripCommonRoot(
    Object.fromEntries(Object.entries(files).map(([path, text]) => [normalizePath(path), text])),
  )
  const habitsCsv = findHabitsCsv(normalized)
  if (!habitsCsv) {
    throw new Error('This file is not a Loop CSV export (Habits.csv is missing).')
  }

  const rows = parseCsv(habitsCsv)
  const habits = rows.map((row, index) => parseHabitRow(row, index))
  const combined = normalized['Checkmarks.csv']
    ? parseCombinedCheckmarks(
        normalized['Checkmarks.csv'],
        habits.map((habit) => habit.name),
      )
    : new Map()

  return habits.map((habit, index) => {
    const perHabit = findHabitCheckmarks(normalized, habit, index)
    const entries = perHabit
      ? parseCheckmarksFile(perHabit)
      : combined.get(habit.name) ?? []
    return { ...habit, entries }
  })
}

export function importLoopCsvArchive(bytes) {
  return importLoopCsvFiles(unzipCsvArchive(bytes))
}

function originalTimeframe(habits, today) {
  let oldest = null
  for (const habit of habits) {
    for (const entry of habit.entries) {
      oldest = oldest ? minDateKey(oldest, entry.date) : entry.date
    }
  }
  return oldest ?? today
}

export function exportLoopCsvFiles(habits, { today = todayKey() } = {}) {
  const ordered = [...habits].sort((a, b) => a.position - b.position)
  const files = {}
  const snapshots = ordered.map((habit) => getHabitSnapshot(habit, { today }))

  files['Habits.csv'] = writeHabitsCsv(ordered)

  ordered.forEach((habit, index) => {
    const dir = habitDirName(habit, index)
    const snapshot = snapshots[index]
    files[`${dir}Checkmarks.csv`] = writeEntriesCsv(snapshot.computedEntries)
    files[`${dir}Scores.csv`] = writeScoresCsv(snapshot)
  })

  const oldest = originalTimeframe(ordered, today)
  files['Checkmarks.csv'] = writeCombinedCheckmarks(ordered, snapshots, oldest, today)
  files['Scores.csv'] = writeCombinedScores(ordered, snapshots, oldest, today)
  return files
}

export function exportLoopCsvArchive(habits, options) {
  const files = exportLoopCsvFiles(habits, options)
  return zipSync(
    Object.fromEntries(Object.entries(files).map(([path, text]) => [path, strToU8(text)])),
    { level: 6 },
  )
}

function writeHabitsCsv(habits) {
  let out = csvLine([
    'Position',
    'Name',
    'Type',
    'Question',
    'Description',
    'FrequencyNumerator',
    'FrequencyDenominator',
    'Color',
    'Unit',
    'Target Type',
    'Target Value',
    'Archived?',
  ])

  habits.forEach((habit, index) => {
    const numerical = isNumericalHabit(habit)
    out += csvLine([
      String(index + 1).padStart(3, '0'),
      habit.name,
      habit.type,
      habit.question ?? '',
      habit.description ?? '',
      String(habit.frequency.numerator),
      String(habit.frequency.denominator),
      getHabitColor(habit.colorIndex).hex,
      numerical ? habit.unit : '',
      numerical ? habit.targetType : '',
      numerical ? habit.targetValue.toFixed(1) : '',
      String(Boolean(habit.isArchived)),
    ])
  })
  return out
}

function writeEntriesCsv(computedEntries) {
  let out = csvLine(['Date', 'Value', 'Notes'])
  for (const entry of knownEntries(computedEntries)) {
    out += csvLine([entry.date, formatEntryValue(entry.value), entry.notes ?? ''])
  }
  return out
}

function writeScoresCsv(snapshot) {
  const today = todayKey()
  const known = knownEntries(snapshot.computedEntries)
  const oldest = known.length ? known[known.length - 1].date : today
  let out = csvLine(['Date', 'Score'])
  for (const score of getScoresByInterval(snapshot.scores, oldest, today)) {
    out += csvLine([score.date, score.value.toFixed(4)])
  }
  return out
}

function writeCombinedHeader(habits) {
  return csvLine(['Date', ...habits.map((habit) => habit.name)])
}

function writeCombinedCheckmarks(habits, snapshots, oldest, today) {
  let out = writeCombinedHeader(habits)
  const days = daysBetween(oldest, today)
  for (let i = 0; i <= days; i += 1) {
    const date = addDays(today, -i)
    const values = snapshots.map((snapshot) =>
      formatEntryValue(snapshot.computedEntries[date]?.value ?? UNKNOWN),
    )
    out += csvLine([date, ...values])
  }
  return out
}

function writeCombinedScores(habits, snapshots, oldest, today) {
  let out = writeCombinedHeader(habits)
  const days = daysBetween(oldest, today)
  for (let i = 0; i <= days; i += 1) {
    const date = addDays(today, -i)
    const values = snapshots.map((snapshot) => (snapshot.scores[date]?.value ?? 0).toFixed(4))
    out += csvLine([date, ...values])
  }
  return out
}

export function downloadBlob(filename, bytes, type = 'application/octet-stream') {
  const blob = new Blob([bytes], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadZip(filename, bytes) {
  downloadBlob(filename, bytes, 'application/zip')
}
