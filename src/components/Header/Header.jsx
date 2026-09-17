import { THEME_CHOICES } from './themeChoices.js'
import './Header.css'

export function Header({ theme, onThemeChange, onAddHabit, showAdd = true }) {
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
        <div className="theme-switch" role="group" aria-label="Color theme">
          {THEME_CHOICES.map((choice) => (
            <button
              key={choice.id}
              type="button"
              aria-pressed={theme === choice.id}
              onClick={() => onThemeChange(choice.id)}
            >
              {choice.label}
            </button>
          ))}
        </div>
        {showAdd ? (
          <button type="button" className="btn btn-primary add-habit" onClick={onAddHabit}>
            Add habit
          </button>
        ) : null}
      </div>
    </header>
  )
}
