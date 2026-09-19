import { createContext, createElement, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { createHabit, cycleYesNoEntry, setHabitEntry } from '../models/Habit.js'
import { applyTheme, defaultAppData } from '../utils/storage.js'

const HabitContext = createContext(null)

function nextPosition(habits) {
  return habits.reduce((max, habit) => Math.max(max, habit.position), -1) + 1
}

function ensureUniqueHabitIds(habits, existingIds = []) {
  const seen = new Set(existingIds)
  return habits.map((habit) => {
    const candidate = habit.id
    if (candidate !== undefined && candidate !== null && !seen.has(candidate)) {
      seen.add(candidate)
      return habit
    }

    const nextId = crypto.randomUUID()
    seen.add(nextId)
    return { ...habit, id: nextId }
  })
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_HABIT': {
      const habit = createHabit({
        ...action.payload,
        position: action.payload?.position ?? nextPosition(state.habits),
      })
      return { ...state, habits: [...state.habits, habit] }
    }
    case 'UPDATE_HABIT': {
      return {
        ...state,
        habits: state.habits.map((habit) =>
          habit.id === action.id ? { ...habit, ...action.patch } : habit,
        ),
      }
    }
    case 'DELETE_HABIT': {
      return {
        ...state,
        habits: state.habits.filter((habit) => habit.id !== action.id),
      }
    }
    case 'SET_ENTRY': {
      return {
        ...state,
        habits: state.habits.map((habit) =>
          habit.id === action.id
            ? setHabitEntry(habit, action.date, action.value, action.notes ?? '')
            : habit,
        ),
      }
    }
    case 'TOGGLE_ENTRY': {
      return {
        ...state,
        habits: state.habits.map((habit) =>
          habit.id === action.id
            ? cycleYesNoEntry(habit, action.date, {
                skipEnabled: state.settings.skipEnabled,
                questionMarksEnabled: state.settings.questionMarksEnabled,
              })
            : habit,
        ),
      }
    }
    case 'REORDER_HABITS': {
      const order = new Map(action.ids.map((id, index) => [id, index]))
      return {
        ...state,
        habits: state.habits
          .map((habit) =>
            order.has(habit.id) ? { ...habit, position: order.get(habit.id) } : habit,
          )
          .sort((a, b) => a.position - b.position),
      }
    }
    case 'SET_THEME': {
      return { ...state, settings: { ...state.settings, theme: action.theme } }
    }
    case 'PATCH_SETTINGS': {
      return { ...state, settings: { ...state.settings, ...action.patch } }
    }
    case 'LOAD_HABITS': {
      return { ...state, habits: ensureUniqueHabitIds(action.habits, state.habits.map((habit) => habit.id)) }
    }
    case 'ARCHIVE_HABIT': {
      return {
        ...state,
        habits: state.habits.map((habit) =>
          habit.id === action.id ? { ...habit, isArchived: action.isArchived } : habit,
        ),
      }
    }
    case 'REPLACE_HABITS': {
      return { ...state, habits: ensureUniqueHabitIds(action.habits) }
    }
    case 'MERGE_HABITS': {
      const offset = nextPosition(state.habits)
      const incoming = ensureUniqueHabitIds(action.habits, state.habits.map((habit) => habit.id)).map(
        (habit, index) => ({
          ...habit,
          position: offset + index,
        }),
      )
      return { ...state, habits: [...state.habits, ...incoming] }
    }
    default:
      return state
  }
}

export function HabitProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, defaultAppData())
  const [hydrated, setHydrated] = useState(false)
  const persistHabitsTimer = useRef(null)
  const persistSettingsTimer = useRef(null)

  useEffect(() => {
    let ignore = false

    Promise.all([
      fetch('/api/habits').then((response) => {
        if (!response.ok) throw new Error('Could not load habits from the database')
        return response.json()
      }),
      fetch('/api/settings').then((response) => {
        if (!response.ok) throw new Error('Could not load settings from the database')
        return response.json()
      }),
    ])
      .then(([habitData, settingsData]) => {
        if (ignore) return
        dispatch({
          type: 'LOAD_HABITS',
          habits: ensureUniqueHabitIds(habitData.habits ?? []),
        })
        dispatch({
          type: 'PATCH_SETTINGS',
          patch: {
            ...defaultAppData().settings,
            ...(settingsData.settings ?? {}),
          },
        })
        setHydrated(true)
      })
      .catch(() => {
        if (!ignore) {
          setHydrated(true)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    applyTheme(state.settings.theme)
  }, [state.settings.theme])

  useEffect(() => {
    if (!hydrated) return undefined

    if (persistHabitsTimer.current) {
      clearTimeout(persistHabitsTimer.current)
    }

    persistHabitsTimer.current = setTimeout(() => {
      fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habits: state.habits }),
      }).catch((error) => {
        console.error('Failed to persist habits to the database', error)
      })
    }, 150)

    return () => {
      if (persistHabitsTimer.current) {
        clearTimeout(persistHabitsTimer.current)
      }
    }
  }, [hydrated, state.habits])

  useEffect(() => {
    if (!hydrated) return undefined

    if (persistSettingsTimer.current) {
      clearTimeout(persistSettingsTimer.current)
    }

    persistSettingsTimer.current = setTimeout(() => {
      fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.settings),
      }).catch((error) => {
        console.error('Failed to persist settings to the database', error)
      })
    }, 150)

    return () => {
      if (persistSettingsTimer.current) {
        clearTimeout(persistSettingsTimer.current)
      }
    }
  }, [hydrated, state.settings])

  const value = useMemo(
    () => ({
      habits: state.habits,
      settings: state.settings,
      addHabit: (payload) => dispatch({ type: 'ADD_HABIT', payload }),
      updateHabit: (id, patch) => dispatch({ type: 'UPDATE_HABIT', id, patch }),
      deleteHabit: (id) => dispatch({ type: 'DELETE_HABIT', id }),
      setEntry: (id, date, value, notes) => dispatch({ type: 'SET_ENTRY', id, date, value, notes }),
      toggleEntry: (id, date) => dispatch({ type: 'TOGGLE_ENTRY', id, date }),
      reorderHabits: (ids) => dispatch({ type: 'REORDER_HABITS', ids }),
      archiveHabit: (id) => dispatch({ type: 'ARCHIVE_HABIT', id, isArchived: true }),
      unarchiveHabit: (id) => dispatch({ type: 'ARCHIVE_HABIT', id, isArchived: false }),
      setTheme: (theme) => dispatch({ type: 'SET_THEME', theme }),
      patchSettings: (patch) => dispatch({ type: 'PATCH_SETTINGS', patch }),
      replaceHabits: (habits) => dispatch({ type: 'REPLACE_HABITS', habits }),
      mergeHabits: (habits) => dispatch({ type: 'MERGE_HABITS', habits }),
    }),
    [state],
  )

  return createElement(HabitContext.Provider, { value }, children)
}

export function useHabits() {
  const context = useContext(HabitContext)
  if (!context) {
    throw new Error('useHabits must be used within HabitProvider')
  }
  return context
}
