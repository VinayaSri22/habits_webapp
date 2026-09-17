import initSqlJs from 'sql.js'
import { NO, SKIP, UNKNOWN, YES_AUTO, YES_MANUAL } from '../models/Entry.js'
import { createFrequency } from '../models/Frequency.js'
import { createHabit } from '../models/Habit.js'
import { HabitType, NumericalHabitType } from '../models/types.js'
import { parseDateKey, toDateKey } from './dateUtils.js'

const DB_TRUE_VALUES = new Set([1, '1', true, 'true', 'TRUE'])

export function timestampToDateKey(timestamp) {
  const value = Number(timestamp)
  if (!Number.isFinite(value)) return null
  return toDateKey(new Date(value))
}

function mapDbHabitType(rawType) {
  return Number(rawType) === 1 ? HabitType.NUMERICAL : HabitType.YES_NO
}

function mapDbTargetType(rawType, isNumerical) {
  if (!isNumerical) return NumericalHabitType.AT_LEAST
  return Number(rawType) === 1 ? NumericalHabitType.AT_MOST : NumericalHabitType.AT_LEAST
}

function clampColorIndex(rawColor) {
  const color = Number(rawColor)
  if (!Number.isInteger(color) || color < 0) return 0
  return color
}

function mapDbEntryValue(rawValue) {
  switch (Number(rawValue)) {
    case NO:
      return NO
    case YES_AUTO:
      return YES_AUTO
    case YES_MANUAL:
      return YES_MANUAL
    case SKIP:
      return SKIP
    default:
      return UNKNOWN
  }
}

function readDbRow(columns, values) {
  return Object.fromEntries(columns.map((column, index) => [column, values[index]]))
}

function parseHabitRecord(row) {
  const type = mapDbHabitType(row.type)
  const frequency = createFrequency(Number(row.freq_num) || 1, Number(row.freq_den) || 1)

  return createHabit({
    id: row.id ?? crypto.randomUUID(),
    uuid: row.uuid ?? crypto.randomUUID().replaceAll('-', ''),
    name: String(row.name ?? '').trim(),
    description: row.description ?? '',
    question: row.question ?? '',
    colorIndex: clampColorIndex(row.color),
    type,
    frequency,
    targetType: mapDbTargetType(row.target_type, type === HabitType.NUMERICAL),
    targetValue: type === HabitType.NUMERICAL ? Number(row.target_value) || 0 : 0,
    unit: type === HabitType.NUMERICAL ? row.unit ?? '' : '',
    isArchived: DB_TRUE_VALUES.has(row.archived),
    position: Number(row.position) || 0,
    entries: [],
  })
}

function parseRepetitionRecord(row) {
  const date = timestampToDateKey(row.timestamp)
  if (!date) return null
  const entry = {
    date,
    value: mapDbEntryValue(row.value),
    notes: row.notes ?? '',
  }
  if (entry.value === UNKNOWN && !entry.notes) return null
  return entry
}

export function importLoopDbDatabase(db) {
  const habitsResult = db.exec('SELECT * FROM Habits ORDER BY position, id')
  if (!habitsResult[0]) {
    throw new Error('This file is not a Loop Habit Tracker database (Habits table is missing).')
  }

  const repetitionsResult = db.exec('SELECT habit, timestamp, value, notes FROM Repetitions ORDER BY timestamp')

  const habits = (habitsResult[0]?.values ?? []).map((values) => {
    const row = readDbRow(habitsResult[0].columns, values)
    return parseHabitRecord(row)
  })

  const byHabit = new Map()
  for (const values of repetitionsResult[0]?.values ?? []) {
    const row = readDbRow(repetitionsResult[0].columns, values)
    const entry = parseRepetitionRecord(row)
    if (!entry) continue
    const key = Number(row.habit)
    const current = byHabit.get(key) ?? []
    current.push(entry)
    byHabit.set(key, current)
  }

  return habits.map((habit) => ({
    ...habit,
    entries: (byHabit.get(Number(habit.id)) ?? byHabit.get(String(habit.id)) ?? []).sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
    ),
  }))
}

function sqlWasmUrl() {
  if (typeof window !== 'undefined') return '/sql-wasm.wasm'
  return new URL('../../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url).href
}

function valueToLoopDb(value) {
  switch (Number(value)) {
    case NO:
      return 0
    case YES_AUTO:
      return 1
    case YES_MANUAL:
      return 2
    case SKIP:
      return 3
    default:
      return 0
  }
}

function dateKeyToTimestamp(dateKey) {
  const parsed = parseDateKey(dateKey)
  return parsed.getTime()
}

export async function exportLoopDbDatabase(habits) {
  const SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl(),
  })
  const database = new SQL.Database()

  database.run(`
    CREATE TABLE Habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      archived INTEGER,
      color INTEGER,
      description TEXT,
      freq_den INTEGER,
      freq_num INTEGER,
      highlight INTEGER,
      name TEXT,
      position INTEGER,
      reminder_hour INTEGER,
      reminder_min INTEGER,
      reminder_days INTEGER,
      type INTEGER,
      target_type INTEGER,
      target_value REAL,
      unit TEXT,
      question TEXT,
      uuid TEXT
    );
  `)

  database.run(`
    CREATE TABLE Repetitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit INTEGER NOT NULL,
      timestamp INTEGER NOT NULL,
      value INTEGER NOT NULL,
      notes TEXT
    );
  `)

  database.run(`
    CREATE TABLE Events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER,
      message TEXT,
      server_id INTEGER
    );
  `)

  database.run('CREATE UNIQUE INDEX idx_repetitions_habit_timestamp ON Repetitions(habit, timestamp);')

  const ordered = [...habits].sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0))

  const habitIds = new Map()
  ordered.forEach((habit, index) => {
    const id = index + 1
    habitIds.set(habit.id ?? habit.uuid ?? index, id)

    const isNumerical = habit.type === HabitType.NUMERICAL
    database.run(
      `INSERT INTO Habits (
        id, archived, color, description, freq_den, freq_num, highlight, name,
        position, reminder_hour, reminder_min, reminder_days, type, target_type,
        target_value, unit, question, uuid
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        habit.isArchived ? 1 : 0,
        Number(habit.colorIndex ?? 0),
        habit.description ?? '',
        Number(habit.frequency?.denominator ?? 1),
        Number(habit.frequency?.numerator ?? 1),
        0,
        habit.name ?? '',
        Number(habit.position ?? index),
        null,
        null,
        127,
        isNumerical ? 1 : 0,
        isNumerical ? (habit.targetType === NumericalHabitType.AT_MOST ? 1 : 0) : 0,
        isNumerical ? Number(habit.targetValue ?? 0) : 0,
        isNumerical ? (habit.unit ?? '') : '',
        habit.question ?? '',
        habit.uuid ?? (habit.id ?? `habit-${index}`),
      ],
    )
  })

  ordered.forEach((habit) => {
    const habitId = habitIds.get(habit.id ?? habit.uuid)
    if (!habitId) return

    ;[...(habit.entries ?? [])]
      .filter((entry) => entry && entry.date && entry.value !== UNKNOWN && entry.value !== null)
      .sort((a, b) => dateKeyToTimestamp(a.date) - dateKeyToTimestamp(b.date))
      .forEach((entry) => {
        database.run(
          'INSERT INTO Repetitions (habit, timestamp, value, notes) VALUES (?, ?, ?, ?);',
          [habitId, dateKeyToTimestamp(entry.date), valueToLoopDb(entry.value), entry.notes ?? ''],
        )
      })
  })

  return database
}

export async function exportLoopDbArchive(habits) {
  const database = await exportLoopDbDatabase(habits)
  try {
    return database.export()
  } finally {
    database.close()
  }
}

export async function importLoopDbArchive(bytes) {
  const SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl(),
  })
  const database = new SQL.Database(new Uint8Array(bytes))
  try {
    return importLoopDbDatabase(database)
  } finally {
    database.close()
  }
}
