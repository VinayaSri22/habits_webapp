/** Loop Habit Tracker's 20-color palette. */
export const HABIT_COLORS = [
  { index: 0, name: 'Red', hex: '#D32F2F' },
  { index: 1, name: 'Deep Orange', hex: '#E64A19' },
  { index: 2, name: 'Orange', hex: '#F57C00' },
  { index: 3, name: 'Amber', hex: '#FF8F00' },
  { index: 4, name: 'Yellow', hex: '#F9A825' },
  { index: 5, name: 'Lime', hex: '#AFB42B' },
  { index: 6, name: 'Light Green', hex: '#7CB342' },
  { index: 7, name: 'Green', hex: '#388E3C' },
  { index: 8, name: 'Teal', hex: '#00897B' },
  { index: 9, name: 'Cyan', hex: '#00ACC1' },
  { index: 10, name: 'Light Blue', hex: '#039BE5' },
  { index: 11, name: 'Blue', hex: '#1976D2' },
  { index: 12, name: 'Indigo', hex: '#303F9F' },
  { index: 13, name: 'Deep Purple', hex: '#5E35B1' },
  { index: 14, name: 'Purple', hex: '#8E24AA' },
  { index: 15, name: 'Pink', hex: '#D81B60' },
  { index: 16, name: 'Brown', hex: '#5D4037' },
  { index: 17, name: 'Dark Grey', hex: '#303030' },
  { index: 18, name: 'Grey', hex: '#757575' },
  { index: 19, name: 'Light Grey', hex: '#aaaaaa' },
]

export const DEFAULT_HABIT_COLOR = 8

export function getHabitColor(index) {
  return HABIT_COLORS[index] ?? HABIT_COLORS[DEFAULT_HABIT_COLOR]
}

export function withAlpha(hex, alpha) {
  const normalized = hex.replace('#', '')
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Black or white, whichever reads better on the given background. */
export function readableTextOn(hex) {
  const normalized = hex.replace('#', '')
  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  // 0.179 is where white and black text have equal WCAG contrast.
  return luminance > 0.179 ? '#1a1c1e' : '#ffffff'
}

export function colorIndexFromHex(hex) {
  if (!hex) return DEFAULT_HABIT_COLOR
  const normalized = hex.trim().toUpperCase()
  const match = HABIT_COLORS.find((color) => color.hex.toUpperCase() === normalized)
  return match?.index ?? DEFAULT_HABIT_COLOR
}
