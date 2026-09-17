import { useCallback, useRef, useState } from 'react'
import { Header } from './components/Header/Header.jsx'
import { HabitDetail } from './components/HabitDetail/HabitDetail.jsx'
import { HabitForm } from './components/HabitForm/HabitForm.jsx'
import { HabitList } from './components/HabitList/HabitList.jsx'
import { HabitProvider, useHabits } from './store/HabitStore.js'
import { HABIT_COLORS } from './utils/colors.js'
import { downloadZip, exportLoopCsvArchive, importLoopCsvArchive } from './utils/loopCsv.js'
import { todayKey } from './utils/dateUtils.js'
import './components/common/Modal.css'
import './App.css'

function AppShell() {
  const {
    habits,
    settings,
    setTheme,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleEntry,
    setEntry,
    reorderHabits,
    replaceHabits,
    mergeHabits,
  } = useHabits()
  const [formOpen, setFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [status, setStatus] = useState(null)
  const emptyImportRef = useRef(null)

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditingHabit(null)
  }, [])

  const visibleHabits = habits.filter((habit) => !habit.isArchived)
  const selectedHabit = habits.find((habit) => habit.id === selectedId) ?? null

  async function handleImportFile(file, { forceReplace = false } = {}) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const imported = importLoopCsvArchive(bytes)
      if (imported.length === 0) {
        setStatus('No habits found in that file.')
        return
      }

      const replace =
        forceReplace ||
        habits.length === 0 ||
        window.confirm(
          `Import ${imported.length} habit${imported.length === 1 ? '' : 's'} from Loop CSV?\n\nOK replaces your current habits.\nCancel adds them alongside.`,
        )

      if (replace) {
        replaceHabits(imported)
        setSelectedId(null)
      } else {
        mergeHabits(imported)
      }
      setStatus(`Imported ${imported.length} habit${imported.length === 1 ? '' : 's'}.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not import that file.')
    }
  }

  function handleExport() {
    const bytes = exportLoopCsvArchive(habits)
    downloadZip(`Loop Habits CSV ${todayKey()}.zip`, bytes)
    setStatus('Exported Loop CSV zip.')
  }

  return (
    <div className="app">
      <Header
        theme={settings.theme}
        onThemeChange={setTheme}
        showAdd={!selectedHabit}
        onAddHabit={() => {
          setEditingHabit(null)
          setFormOpen(true)
        }}
        onImportFile={handleImportFile}
        onExport={handleExport}
      />

      {status ? (
        <p className="app-status" role="status">
          {status}
          <button type="button" className="icon-button" aria-label="Dismiss" onClick={() => setStatus(null)}>
            ×
          </button>
        </p>
      ) : null}

      <main className="app-main">
        {selectedHabit ? (
          <HabitDetail
            habit={selectedHabit}
            onBack={() => setSelectedId(null)}
            onEdit={() => {
              setEditingHabit(selectedHabit)
              setFormOpen(true)
            }}
            onToggle={toggleEntry}
            onSetEntry={setEntry}
          />
        ) : visibleHabits.length === 0 ? (
          <section className="empty-state">
            <h2>No habits yet</h2>
            <p>Create a habit, or import a Loop Habit Tracker CSV zip from the Android app.</p>
            <div className="palette" aria-hidden="true">
              {HABIT_COLORS.map((color) => (
                <span key={color.index} className="swatch" style={{ background: color.hex }} />
              ))}
            </div>
            <div className="empty-actions">
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
              <button type="button" className="btn btn-ghost" onClick={() => emptyImportRef.current?.click()}>
                Import Loop CSV
              </button>
              <input
                ref={emptyImportRef}
                type="file"
                accept=".zip,application/zip"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) handleImportFile(file, { forceReplace: true })
                }}
              />
            </div>
          </section>
        ) : (
          <HabitList
            habits={habits}
            onToggle={toggleEntry}
            onSetEntry={setEntry}
            onOpen={(habit) => setSelectedId(habit.id)}
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
          if (selectedId === id) setSelectedId(null)
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
