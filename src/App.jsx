import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from './components/common/ConfirmDialog.jsx'
import { Header } from './components/Header/Header.jsx'
import { HabitDetail } from './components/HabitDetail/HabitDetail.jsx'
import { HabitForm } from './components/HabitForm/HabitForm.jsx'
import { HabitList } from './components/HabitList/HabitList.jsx'
import { HabitProvider, useHabits } from './store/HabitStore.js'
import { HABIT_COLORS } from './utils/colors.js'
import { downloadZip, exportLoopCsvArchive, importLoopCsvArchive } from './utils/loopCsv.js'
import { importLoopDbArchive } from './utils/loopDb.js'
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
    archiveHabit,
    unarchiveHabit,
    replaceHabits,
    mergeHabits,
  } = useHabits()
  const [formOpen, setFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [status, setStatus] = useState(null)
  const [importChoice, setImportChoice] = useState(null)

  useEffect(() => {
    if (!status) return undefined
    const timer = setTimeout(() => {
      setStatus(null)
    }, 3500)
    return () => clearTimeout(timer)
  }, [status])

  const closeForm = useCallback(() => {
    setFormOpen(false)
    setEditingHabit(null)
  }, [])

  const visibleHabits = habits.filter((habit) => !habit.isArchived)
  const archivedHabits = habits.filter((habit) => habit.isArchived)
  const selectedHabit = habits.find((habit) => habit.id === selectedId) ?? null

  async function handleImportFile(file, { forceReplace = false } = {}) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const isSqlite = /\.(db|sqlite|sqlite3|db3)$/i.test(file.name)
      const imported = isSqlite ? await importLoopDbArchive(bytes) : importLoopCsvArchive(bytes)
      if (imported.length === 0) {
        setStatus('No habits found in that file.')
        return
      }

      if (forceReplace || habits.length === 0) {
        replaceHabits(imported)
        setSelectedId(null)
        setStatus(`Imported ${imported.length} habit${imported.length === 1 ? '' : 's'}.`)
        return
      }

      setImportChoice({ imported, count: imported.length })
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
        <div className="toast-container" role="status" aria-live="polite">
          <div className="app-toast" onClick={() => setStatus(null)} title="Click to dismiss">
            <span className="toast-dot" aria-hidden="true" />
            <span className="toast-message">{status}</span>
          </div>
        </div>
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
            onArchive={(id) => {
              archiveHabit(id)
              setSelectedId(null)
              setStatus('Habit archived.')
            }}
            onUnarchive={(id) => {
              unarchiveHabit(id)
              setStatus('Habit restored.')
            }}
          />
        ) : visibleHabits.length === 0 ? (
          <section className="empty-state">
            <h2>{archivedHabits.length > 0 ? 'No active habits' : 'No habits yet'}</h2>
            <p>
              {archivedHabits.length > 0
                ? 'Your habits are archived. Restore one when you are ready to track it again.'
                : 'Create a habit, or import a Loop Habit Tracker CSV zip from the Android app.'}
            </p>
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
            </div>
            {archivedHabits.length > 0 ? (
              <div className="empty-archive-list">
                {archivedHabits.map((habit) => (
                  <article key={habit.id} className="archived-row">
                    <button type="button" className="archived-name" onClick={() => setSelectedId(habit.id)}>
                      {habit.name}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => unarchiveHabit(habit.id)}>
                      Unarchive
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ) : (
          <HabitList
            habits={visibleHabits}
            archivedHabits={archivedHabits}
            showArchived={showArchived}
            onToggle={toggleEntry}
            onSetEntry={setEntry}
            onOpen={(habit) => setSelectedId(habit.id)}
            onReorder={reorderHabits}
            onArchive={(id) => {
              archiveHabit(id)
              setStatus('Habit archived.')
            }}
            onUnarchive={(id) => {
              unarchiveHabit(id)
              setStatus('Habit restored.')
            }}
            onToggleArchived={() => setShowArchived((current) => !current)}
          />
        )}
      </main>

      <HabitForm
        open={formOpen}
        habit={editingHabit}
        onClose={closeForm}
        onSave={(payload) => {
          if (editingHabit) {
            updateHabit(editingHabit.id, { ...payload, isArchived: editingHabit.isArchived })
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

      <ConfirmDialog
        open={Boolean(importChoice)}
        title="Import habits"
        message={
          importChoice
            ? `Found ${importChoice.count} habit${importChoice.count === 1 ? '' : 's'} in this file.\n\nReplace your current habits, or add the imported ones alongside them?`
            : ''
        }
        onClose={() => setImportChoice(null)}
        actions={[
          {
            label: 'Replace all',
            variant: 'danger',
            onClick: () => {
              replaceHabits(importChoice.imported)
              setSelectedId(null)
              setStatus(`Imported ${importChoice.count} habit${importChoice.count === 1 ? '' : 's'}.`)
              setImportChoice(null)
            },
          },
          {
            label: 'Add alongside',
            variant: 'primary',
            onClick: () => {
              mergeHabits(importChoice.imported)
              setStatus(`Imported ${importChoice.count} habit${importChoice.count === 1 ? '' : 's'}.`)
              setImportChoice(null)
            },
          },
          {
            label: 'Cancel',
            variant: 'ghost',
            onClick: () => setImportChoice(null),
          },
        ]}
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
