const STORAGE_KEY = 'loop-habits:v1'
const APP_VERSION = 1

export const THEME_OPTIONS = ['system', 'light', 'dark']

export function defaultAppData() {
  return {
    version: APP_VERSION,
    habits: [],
    settings: {
      theme: 'system',
      skipEnabled: true,
      questionMarksEnabled: true,
    },
  }
}

export function loadAppData() {
  if (typeof localStorage === 'undefined') return defaultAppData()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultAppData()
    return migrateAppData(JSON.parse(raw))
  } catch {
    return defaultAppData()
  }
}

export function saveAppData(data) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: APP_VERSION }))
}

export function clearAppData() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

function migrateAppData(data) {
  const defaults = defaultAppData()
  if (!data || typeof data !== 'object') return defaults

  return {
    version: APP_VERSION,
    habits: Array.isArray(data.habits) ? data.habits.map(normalizeHabitRecord) : [],
    settings: {
      ...defaults.settings,
      ...(data.settings && typeof data.settings === 'object' ? data.settings : {}),
    },
  }
}

function normalizeHabitRecord(habit) {
  return {
    ...habit,
    entries: Array.isArray(habit.entries) ? habit.entries : [],
    frequency: habit.frequency ?? { numerator: 1, denominator: 1 },
  }
}

export function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'light' || theme === 'dark') {
    root.dataset.theme = theme
  } else {
    delete root.dataset.theme
  }
}

export { STORAGE_KEY, APP_VERSION }
