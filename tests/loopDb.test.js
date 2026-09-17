import assert from 'node:assert/strict'
import { test } from 'node:test'
import initSqlJs from 'sql.js'
import { importLoopDbDatabase, timestampToDateKey } from '../src/utils/loopDb.js'

const SQL = await initSqlJs({
  locateFile: (file) => new URL(`../node_modules/sql.js/dist/${file}`, import.meta.url).href,
})

test('timestampToDateKey converts DB epoch milliseconds into the app date key format', () => {
  const ts = new Date(2024, 9, 12, 12, 0, 0).getTime()
  assert.equal(timestampToDateKey(ts), '2024-10-12')
})

test('importLoopDbDatabase converts Loop Habits tables into app habits and entries', () => {
  const db = new SQL.Database()
  db.run(`
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
    CREATE TABLE Repetitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit INTEGER,
      timestamp INTEGER,
      value INTEGER,
      notes TEXT
    );
  `)

  db.run(
    `INSERT INTO Habits (id, archived, color, description, freq_den, freq_num, highlight, name, position, reminder_hour, reminder_min, reminder_days, type, target_type, target_value, unit, question, uuid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      7,
      0,
      11,
      'Daily flossing',
      1,
      1,
      0,
      'Brush and floss',
      0,
      23,
      0,
      127,
      0,
      0,
      0,
      '',
      'How did you do?',
      'habit-7-uuid',
    ],
  )

  const time = new Date(2024, 9, 12, 12, 0, 0).getTime()
  db.run('INSERT INTO Repetitions (habit, timestamp, value, notes) VALUES (?, ?, ?, ?);', [
    7,
    time,
    2,
    '',
  ])
  db.run('INSERT INTO Repetitions (habit, timestamp, value, notes) VALUES (?, ?, ?, ?);', [
    7,
    new Date(2024, 9, 13, 12, 0, 0).getTime(),
    0,
    '',
  ])

  const habits = importLoopDbDatabase(db)
  assert.equal(habits.length, 1)
  assert.equal(habits[0].name, 'Brush and floss')
  assert.equal(habits[0].type, 'YES_NO')
  assert.deepEqual(
    habits[0].entries.map((entry) => ({ date: entry.date, value: entry.value })),
    [
      { date: '2024-10-13', value: 0 },
      { date: '2024-10-12', value: 2 },
    ],
  )
  assert.equal(habits[0].colorIndex, 11)
})
