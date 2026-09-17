import { useRef } from 'react'
import './Header.css'

export function Header({
  theme,
  onThemeChange,
  onAddHabit,
  showAdd = true,
  onImportFile,
  onExport,
}) {
  const fileRef = useRef(null)
  const isDark = theme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'

  return (
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
      <div className="header-actions">
        <button
          type="button"
          className="theme-toggle"
          aria-pressed={isDark}
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
          onClick={() => onThemeChange(nextTheme)}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 3v2.2M12 18.8V21M4.64 4.64l1.55 1.55M17.81 17.81l1.55 1.55M3 12h2.2M18.8 12H21M4.64 19.36l1.55-1.55M17.81 6.19l1.55-1.55"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M20.2 14.2A7.6 7.6 0 0 1 9.8 3.8 8.7 8.7 0 1 0 20.2 14.2Z"
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
          )}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onExport}>
          Export CSV
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
          Import CSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) onImportFile(file)
          }}
        />
        {showAdd ? (
          <button type="button" className="btn btn-primary add-habit" onClick={onAddHabit}>
            Add habit
          </button>
        ) : null}
      </div>
    </header>
  )
}
