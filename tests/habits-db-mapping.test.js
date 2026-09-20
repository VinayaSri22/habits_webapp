import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeDbDate, normalizeHabitForDb, normalizeHabitFromDb } from '../server/habitsService.js'

test('normalizeDbDate keeps the calendar date stable across timezones', () => {
  assert.equal(normalizeDbDate('2026-09-19T18:30:00.000Z'), '2026-09-19')
})

test('normalizeHabitForDb stores the app shape in Postgres-ready rows', () => {
  const habit = {
    id: 'habit-1',
    uuid: 'abc123',
    name: 'Read',
    description: 'Evening reading',
    question: 'Read?',
    colorIndex: 4,
    type: 'YES_NO',
    frequency: { numerator: 1, denominator: 1 },
    targetType: 'AT_LEAST',
    targetValue: 0,
    unit: '',
    isArchived: false,
    position: 0,
    entries: [
      { date: '2026-09-19', value: 2, notes: 'done' },
      { date: '2026-09-20', value: 0, notes: '' },
    ],
  }

  const result = normalizeHabitForDb(habit)

  assert.equal(result.habit.name, 'Read')
  assert.equal(result.habit.color_index, 4)
  assert.equal(result.habit.frequency_numerator, 1)
  assert.equal(result.habit.frequency_denominator, 1)
  assert.deepEqual(result.entries, [
    { entry_date: '2026-09-19', value: 2, notes: 'done' },
    { entry_date: '2026-09-20', value: 0, notes: '' },
  ])
})

test('normalizeHabitFromDb restores the client habit shape', () => {
  const dbHabit = {
    id: 7,
    uuid: 'abc123',
    name: 'Read',
    description: 'Evening reading',
    question: 'Read?',
    color_index: 3,
    type: 'YES_NO',
    frequency_numerator: 2,
    frequency_denominator: 3,
    target_type: 'AT_LEAST',
    target_value: 1,
    unit: 'pages',
    archived: true,
    position: 9,
    created_at: '2026-09-01T00:00:00.000Z',
    updated_at: '2026-09-02T00:00:00.000Z',
  }

  const rows = [
    { habit_id: 7, entry_date: '2026-09-19', value: 2, notes: 'done' },
    { habit_id: 7, entry_date: '2026-09-20', value: 0, notes: '' },
  ]

  const result = normalizeHabitFromDb(dbHabit, rows)

  assert.equal(result.id, 7)
  assert.equal(result.name, 'Read')
  assert.equal(result.isArchived, true)
  assert.equal(result.position, 9)
  assert.deepEqual(result.frequency, { numerator: 2, denominator: 3 })
  assert.deepEqual(result.entries, [
    { date: '2026-09-19', value: 2, notes: 'done' },
    { date: '2026-09-20', value: 0, notes: '' },
  ])
})
