import { useCallback, useState } from 'react'
import { Header } from './components/Header/Header.jsx'
import { HabitForm } from './components/HabitForm/HabitForm.jsx'
import { HabitList } from './components/HabitList/HabitList.jsx'
import { HabitProvider, useHabits } from './store/HabitStore.js'
import { HABIT_COLORS } from './utils/colors.js'
import './components/common/Modal.css'
import './App.css'

function AppShell() {
  const { habits, settings, setTheme, addHabit, updateHabit, deleteHabit, toggleEntry, setEntry, reorderHabits } =
    useHabits()
  const [formOpen, setFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditingHabit(null)
  }, [])

  const visibleHabits = habits.filter((habit) => !habit.isArchived)

  return (
    <div className="app">
      <Header
        theme={settings.theme}
        onThemeChange={setTheme}
        onAddHabit={() => {
          setEditingHabit(null)
          setFormOpen(true)
        }}
      />

      <main className="app-main">
        {visibleHabits.length === 0 ? (
          <section className="empty-state">
            <h2>No habits yet</h2>
            <p>Create a habit, then tap the last few days to check in. Everything stays on this device.</p>
            <div className="palette" aria-hidden="true">
              {HABIT_COLORS.map((color) => (
                <span key={color.index} className="swatch" style={{ background: color.hex }} />
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setEditingHabit(null)
                setFormOpen(true)
              }}
            >
              Add your first habit
            </button>
          </section>
        ) : (
          <HabitList
            habits={habits}
            onToggle={toggleEntry}
            onSetEntry={setEntry}
            onEdit={(habit) => {
              setEditingHabit(habit)
              setFormOpen(true)
            }}
            onReorder={reorderHabits}
          />
        )}
      </main>

      <HabitForm
        open={formOpen}
        habit={editingHabit}
        onClose={closeForm}
        onSave={(payload) => {
          if (editingHabit) {
            updateHabit(editingHabit.id, payload)
          } else {
            addHabit(payload)
          }
          closeForm()
        }}
        onDelete={(id) => {
          deleteHabit(id)
          closeForm()
        }}
      />
    </div>
  )
}

function App() {
  return (
    <HabitProvider>
      <AppShell />
    </HabitProvider>
  )
}

export default App
