import { useEffect, useRef, useState } from 'react'
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
  const menuRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [importFormat, setImportFormat] = useState('csv')
  const isDark = theme === 'dark'
  const nextTheme = isDark ? 'light' : 'dark'

  useEffect(() => {
    if (!menuOpen) return undefined

    function onPointerDown(event) {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

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
        {showAdd ? (
          <button type="button" className="header-icon-button add-habit" onClick={onAddHabit} aria-label="Add habit">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </button>
        ) : null}
        <button
          type="button"
          className="header-icon-button theme-toggle"
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
        <div className="overflow-menu" ref={menuRef}>
          <button
            type="button"
            className="header-icon-button"
            aria-label="Import and export"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="5" r="1.8" fill="currentColor" />
              <circle cx="12" cy="12" r="1.8" fill="currentColor" />
              <circle cx="12" cy="19" r="1.8" fill="currentColor" />
            </svg>
          </button>
          {menuOpen ? (
            <div className="header-menu" role="menu">
              <div className="header-menu-group">
                <button
                  type="button"
                  className="header-menu-section-trigger"
                  onClick={() => setActiveSection((current) => (current === 'import' ? null : 'import'))}
                >
                  <span>Import</span>
                  <span className="menu-chevron">{activeSection === 'import' ? '▾' : '▸'}</span>
                </button>
                {activeSection === 'import' ? (
                  <div className="header-menu-submenu">
                    <button
                      type="button"
                      role="menuitem"
                      className="header-menu-item"
                      onClick={() => {
                        setImportFormat('csv')
                        setMenuOpen(false)
                        setActiveSection(null)
                        fileRef.current?.click()
                      }}
                    >
                      CSV
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="header-menu-item"
                      onClick={() => {
                        setImportFormat('db')
                        setMenuOpen(false)
                        setActiveSection(null)
                        fileRef.current?.click()
                      }}
                    >
                      DB
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="header-menu-group">
                <button
                  type="button"
                  className="header-menu-section-trigger"
                  onClick={() => setActiveSection((current) => (current === 'export' ? null : 'export'))}
                >
                  <span>Export</span>
                  <span className="menu-chevron">{activeSection === 'export' ? '▾' : '▸'}</span>
                </button>
                {activeSection === 'export' ? (
                  <div className="header-menu-submenu">
                    <button
                      type="button"
                      role="menuitem"
                      className="header-menu-item"
                      onClick={() => {
                        setMenuOpen(false)
                        setActiveSection(null)
                        onExport('csv')
                      }}
                    >
                      CSV
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="header-menu-item"
                      onClick={() => {
                        setMenuOpen(false)
                        setActiveSection(null)
                        onExport('db')
                      }}
                    >
                      DB
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept={importFormat === 'db' ? '.db,.sqlite,.sqlite3,.db3' : '.zip,application/zip'}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) onImportFile(file)
          }}
        />
      </div>
    </header>
  )
}
