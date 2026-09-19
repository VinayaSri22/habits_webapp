export function normalizeDbDate(value) {
  if (!value) return ''

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

    const date = new Date(trimmed)
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10)
    return trimmed
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }

  return String(value)
}

export function normalizeHabitForDb(habit) {
  const entries = Array.isArray(habit.entries)
    ? habit.entries.map((entry) => ({
        entry_date: normalizeDbDate(entry.date),
        value: Number(entry.value ?? 0),
        notes: entry.notes ?? '',
      }))
    : []

  return {
    habit: {
      uuid: habit.uuid,
      name: habit.name ?? '',
      description: habit.description ?? '',
      question: habit.question ?? '',
      color_index: Number(habit.colorIndex ?? 0),
      type: habit.type ?? 'YES_NO',
      frequency_numerator: Number(habit.frequency?.numerator ?? 1),
      frequency_denominator: Number(habit.frequency?.denominator ?? 1),
      target_type: habit.targetType ?? 'AT_LEAST',
      target_value: Number(habit.targetValue ?? 0),
      unit: habit.unit ?? '',
      archived: Boolean(habit.isArchived),
      position: Number(habit.position ?? 0),
    },
    entries,
  }
}

export function normalizeHabitFromDb(dbHabit, rows = []) {
  return {
    id: dbHabit.id,
    uuid: dbHabit.uuid,
    name: dbHabit.name,
    description: dbHabit.description ?? '',
    question: dbHabit.question ?? '',
    colorIndex: Number(dbHabit.color_index ?? 0),
    type: dbHabit.type ?? 'YES_NO',
    frequency: {
      numerator: Number(dbHabit.frequency_numerator ?? 1),
      denominator: Number(dbHabit.frequency_denominator ?? 1),
    },
    targetType: dbHabit.target_type ?? 'AT_LEAST',
    targetValue: Number(dbHabit.target_value ?? 0),
    unit: dbHabit.unit ?? '',
    isArchived: Boolean(dbHabit.archived),
    position: Number(dbHabit.position ?? 0),
    createdAt: dbHabit.created_at,
    updatedAt: dbHabit.updated_at,
    entries: (rows ?? []).map((row) => ({
      date: normalizeDbDate(row.entry_date),
      value: Number(row.value ?? 0),
      notes: row.notes ?? '',
    })),
  }
}
