import { HABIT_COLORS } from './utils/colors.js'
import { getHabitSnapshot } from './models/Habit.js'
import { HabitProvider, useHabits } from './store/HabitStore.js'
import './App.css'

const THEME_CHOICES = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

function AppShell() {
  const { habits, settings, setTheme } = useHabits()

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            L
          </div>
          <div>
            <h1>Loop Habits</h1>
            <p>Private, local habit tracking</p>
          </div>
        </div>
        <div className="theme-switch" role="group" aria-label="Color theme">
          {THEME_CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              aria-pressed={settings.theme === choice.id}
              onClick={() => setTheme(choice.id)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </header>

      <main className="app-main">
        {habits.length === 0 ? (
          <section className="empty-state">
            <h2>No habits yet</h2>
            <p>
              Your habits stay on this device. Check-ins, scores, and streaks will
              appear here once you add your first habit.
            </p>
            <div className="palette" aria-label="Habit color palette">
              {HABIT_COLORS.map((color) => (
                <span
                  key={color.index}
                  className="swatch"
                  title={color.name}
                  style={{ background: color.hex }}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="habit-preview">
            {habits
              .filter((habit) => !habit.isArchived)
              .sort((a, b) => a.position - b.position)
              .map((habit) => {
                const snapshot = getHabitSnapshot(habit)
                return (
                  <article key={habit.id} className="habit-row">
                    <div>
                      <strong>{habit.name}</strong>
                      <span>{snapshot.isCompletedToday ? 'Completed today' : 'Not completed today'}</span>
                    </div>
                    <div className="score-pill">{snapshot.scorePercent}%</div>
                  </article>
                )
              })}
          </section>
        )}
      </main>
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
