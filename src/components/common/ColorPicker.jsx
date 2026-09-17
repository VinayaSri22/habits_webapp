import { HABIT_COLORS } from '../../utils/colors.js'
import './ColorPicker.css'

export function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker" role="listbox" aria-label="Habit color">
      {HABIT_COLORS.map((color) => {
        const selected = value === color.index
        return (
          <button
            key={color.index}
            type="button"
            role="option"
            aria-selected={selected}
            className={selected ? 'color-swatch selected' : 'color-swatch'}
            title={color.name}
            style={{ background: color.hex }}
            onClick={() => onChange(color.index)}
          />
        )
      })}
    </div>
  )
}
