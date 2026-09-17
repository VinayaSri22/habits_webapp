# 🔄 Loop Habits — Web Edition

A modern web version of [Loop Habit Tracker](https://github.com/iSoron/uhabits), the beloved open-source Android app for building and maintaining long-term positive habits.

> **Inspired by** the original Loop Habit Tracker by Álinson Santos Xavier — rebuilt for the browser with React.

---

## ✨ Vision

Bring the elegant simplicity and powerful habit-tracking algorithm of Loop Habit Tracker to the web. Fully local, fully private, no accounts required — your data stays on your device.

---

## 🎯 Core Features

### Habit Management
- **Yes/No Habits** — Simple binary completion (e.g., *"Meditate"*, *"Read"*)
- **Measurable Habits** — Numerical targets with units (e.g., *"Drink 2000 ml water"*, *"Run 5 km"*)
- **Flexible Scheduling** — Daily, N times per week, N times per month, or every N days
- **Color Coding** — 20 vibrant accent colors per habit (matching Loop's palette)
- **Archive/Unarchive** — Hide completed or paused habits without deleting data

### Quick Check-In
- **Inline Toggles** — Check off habits directly from the main list for the past several days
- **Toggle States** — Yes ✓ → Skip ⊘ → No ✗ → Unknown ? (matching Loop's toggle cycle)
- **Numerical Entry** — Tap to enter measured values for numerical habits

### Habit Score Algorithm
Ported directly from Loop's source code — the signature exponential decay formula:

```
score = previousScore × multiplier + checkmarkValue × (1 − multiplier)

where: multiplier = 0.5 ^ (√frequency / 13.0)
```

- Missing a single day **reduces** habit strength slightly — it does NOT reset your progress to zero
- Every repetition makes your habit stronger, every missed day makes it weaker
- Much more forgiving and psychologically motivating than simple streak counters

### Analytics & Detail View
- **Habit Score Chart** — Score (0–100%) over time with smooth line chart
- **Calendar Heatmap** — Visual grid showing completion history
- **Streak Stats** — Current streak, best streak, total completions
- **Frequency Bar Chart** — Day-of-week distribution of completions

### Data & Privacy
- **100% Local Storage** — All data persisted in browser's `localStorage` (data survives closing the browser, reopening tabs — it stays on your device permanently per browser, not per window)
- **CSV Export/Import** — Export your habits and check-in history to spreadsheets (CSV), just like the original Loop app. Import CSV data back to restore.
- **No Account Required** — Zero server dependencies, works fully offline
- **PWA Ready** — Installable as a standalone app on desktop and mobile

> **Note on localStorage:** Your data persists across all tabs and browser sessions on the same domain. It is browser-specific (Chrome ≠ Firefox) and device-specific (no cloud sync). Storage limit is ~5–10 MB, which is more than enough for habit tracking. For future scalability, we can upgrade to IndexedDB.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18+ (JavaScript) |
| **Build Tool** | Vite |
| **Styling** | Vanilla CSS (custom design system) |
| **Charts** | SVG-based (custom lightweight charts) |
| **Storage** | localStorage + JSON export |
| **Fonts** | Inter (via Google Fonts) |

---

## 🏗 Architecture

```
src/
├── components/          # Reusable UI components
│   ├── HabitList/       # Main habit list with inline checkmarks
│   ├── HabitCard/       # Individual habit row with toggle dots
│   ├── HabitForm/       # Create/Edit habit modal
│   ├── HabitDetail/     # Detail view with charts & stats
│   ├── Header/          # App header with actions
│   └── common/          # Buttons, modals, color picker, etc.
├── models/              # Data models & business logic
│   ├── Habit.js         # Habit model
│   ├── Entry.js         # Entry model (check-in records)
│   ├── Score.js         # Score computation (Loop's algorithm)
│   ├── Streak.js        # Streak calculation
│   └── Frequency.js     # Frequency model (numerator/denominator)
├── store/               # State management
│   └── HabitStore.js    # React Context + useReducer store
├── utils/               # Helpers
│   ├── dateUtils.js     # Date manipulation helpers
│   ├── storage.js       # localStorage read/write + CSV export/import
│   └── colors.js        # Loop's 20-color palette
├── App.jsx              # Root component & routing
├── main.jsx             # Vite entry point
└── index.css            # Global styles & design tokens
```

---

## 🎨 Color Palette

Matching Loop's original 20-color palette:

| Index | Color | Hex |
|-------|-------|-----|
| 0 | 🔴 Red | `#D32F2F` |
| 1 | 🟠 Deep Orange | `#E64A19` |
| 2 | 🟠 Orange | `#F57C00` |
| 3 | 🟡 Amber | `#FF8F00` |
| 4 | 🟡 Yellow | `#F9A825` |
| 5 | 🟢 Lime | `#AFB42B` |
| 6 | 🟢 Light Green | `#7CB342` |
| 7 | 🟢 Green | `#388E3C` |
| 8 | 🟢 Teal | `#00897B` |
| 9 | 🔵 Cyan | `#00ACC1` |
| 10 | 🔵 Light Blue | `#039BE5` |
| 11 | 🔵 Blue | `#1976D2` |
| 12 | 🔵 Indigo | `#303F9F` |
| 13 | 🟣 Deep Purple | `#5E35B1` |
| 14 | 🟣 Purple | `#8E24AA` |
| 15 | 🩷 Pink | `#D81B60` |
| 16 | 🟤 Brown | `#5D4037` |
| 17 | ⚫ Dark Grey | `#303030` |
| 18 | ⚪ Grey | `#757575` |
| 19 | ⚪ Light Grey | `#aaaaaa` |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📋 Development Phases

### Phase 1 — Foundation ✅
- [x] Vite + React project setup
- [x] Design system (CSS tokens, typography, dark/light mode)
- [x] Data models (Habit, Entry, Score, Streak, Frequency)
- [x] localStorage persistence layer

### Phase 2 — Core Tracker ✅
- [x] Main habit list view with inline checkmark toggles
- [x] Create/Edit habit modal (name, color, frequency, type)
- [x] Toggle habit entries (yes/no/skip cycle)
- [x] Numerical habit value entry
- [x] Habit reordering (drag or manual)

### Phase 3 — Analytics ✅
- [x] Habit detail view
- [x] Score line chart (SVG)
- [x] Calendar heatmap
- [x] Streak statistics
- [x] Day-of-week frequency chart

### Phase 4 — Polish
- [x] Dark mode / Light mode toggle
- [x] Archive/Unarchive habits
- [x] CSV data export & import (matching Loop's format)
- [x] Responsive mobile layout
- [ ] PWA manifest & service worker

---

## 📄 License

This project is inspired by [Loop Habit Tracker](https://github.com/iSoron/uhabits) (GPLv3).

The scoring algorithm is a direct JavaScript port of the original Kotlin implementation by Álinson Santos Xavier.
