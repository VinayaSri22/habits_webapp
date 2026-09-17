import { useState } from 'react'
import { ColorPicker } from '../common/ColorPicker.jsx'
import { Modal } from '../common/Modal.jsx'
import { createFrequency } from '../../models/Frequency.js'
import { HabitType, NumericalHabitType } from '../../models/types.js'
import { DEFAULT_HABIT_COLOR } from '../../utils/colors.js'
import '../common/Modal.css'
import './HabitForm.css'

function frequencyToForm(frequency) {
  const { numerator, denominator } = frequency ?? { numerator: 1, denominator: 1 }
  if (numerator === 1 && denominator === 1) {
    return { schedule: 'daily', times: 3, interval: 2 }
  }
  if (denominator === 7) {
    return { schedule: 'weekly', times: numerator, interval: 2 }
  }
  if (denominator === 30 || denominator === 31) {
    return { schedule: 'monthly', times: numerator, interval: 2 }
  }
  return { schedule: 'every', times: numerator, interval: denominator }
}

function formToFrequency({ schedule, times, interval }) {
  const count = Math.max(1, Number.parseInt(times, 10) || 1)
  const every = Math.max(2, Number.parseInt(interval, 10) || 2)
  if (schedule === 'daily') return createFrequency(1, 1)
  if (schedule === 'weekly') return createFrequency(Math.min(count, 6), 7)
  if (schedule === 'monthly') return createFrequency(Math.min(count, 15), 30)
  return createFrequency(1, every)
}

function blankForm() {
  return {
    name: '',
    question: '',
    description: '',
    colorIndex: DEFAULT_HABIT_COLOR,
    type: HabitType.YES_NO,
    targetType: NumericalHabitType.AT_LEAST,
    targetValue: '10',
    unit: '',
    schedule: 'daily',
    times: 3,
    interval: 2,
  }
}

function habitToForm(habit) {
  return {
    ...blankForm(),
    name: habit.name,
    question: habit.question,
    description: habit.description,
    colorIndex: habit.colorIndex,
    type: habit.type,
    targetType: habit.targetType,
    targetValue: String(habit.targetValue || ''),
    unit: habit.unit,
    ...frequencyToForm(habit.frequency),
  }
}

export function HabitForm({ open, habit, onClose, onSave, onDelete }) {
  if (!open) return null
  return (
    <HabitFormFields
      key={habit?.id ?? 'new'}
      habit={habit}
      onClose={onClose}
      onSave={onSave}
      onDelete={onDelete}
    />
  )
}

function HabitFormFields({ habit, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => (habit ? habitToForm(habit) : blankForm()))
  const isEdit = Boolean(habit)

  function update(patch) {
    setForm((current) => ({ ...current, ...patch }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) return

    const payload = {
      name,
      question: form.question.trim(),
      description: form.description.trim(),
      colorIndex: form.colorIndex,
      type: form.type,
      frequency: formToFrequency(form),
      targetType: form.targetType,
      targetValue: form.type === HabitType.NUMERICAL ? Number(form.targetValue) || 0 : 0,
      unit: form.type === HabitType.NUMERICAL ? form.unit.trim() : '',
    }

    onSave(payload)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit habit' : 'New habit'}
      footer={
        <>
          {isEdit ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                if (window.confirm(`Delete “${habit.name}”? This cannot be undone.`)) {
                  onDelete(habit.id)
                }
              }}
            >
              Delete
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="habit-form" className="btn btn-primary">
            {isEdit ? 'Save' : 'Create'}
          </button>
        </>
      }
    >
      <form id="habit-form" className="habit-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Name</span>
          <input
            required
            value={form.name}
            onChange={(event) => update({ name: event.target.value })}
            placeholder="Meditate"
          />
        </label>

        <label className="field">
          <span>Question</span>
          <input
            value={form.question}
            onChange={(event) => update({ question: event.target.value })}
            placeholder="Did you meditate today?"
          />
        </label>

        <div className="field">
          <span>Color</span>
          <ColorPicker
            value={form.colorIndex}
            onChange={(colorIndex) => update({ colorIndex })}
          />
        </div>

        <div className="field">
          <span>Type</span>
          <div className="segmented">
            <button
              type="button"
              aria-pressed={form.type === HabitType.YES_NO}
              onClick={() => update({ type: HabitType.YES_NO })}
            >
              Yes / No
            </button>
            <button
              type="button"
              aria-pressed={form.type === HabitType.NUMERICAL}
              onClick={() => update({ type: HabitType.NUMERICAL })}
            >
              Measurable
            </button>
          </div>
        </div>

        {form.type === HabitType.NUMERICAL ? (
          <>
            <div className="field-row">
              <label className="field">
                <span>Target</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.targetValue}
                  onChange={(event) => update({ targetValue: event.target.value })}
                />
              </label>
              <label className="field">
                <span>Unit</span>
                <input
                  value={form.unit}
                  onChange={(event) => update({ unit: event.target.value })}
                  placeholder="ml, km, pages"
                />
              </label>
            </div>
            <div className="field">
              <span>Target type</span>
              <div className="segmented">
                <button
                  type="button"
                  aria-pressed={form.targetType === NumericalHabitType.AT_LEAST}
                  onClick={() => update({ targetType: NumericalHabitType.AT_LEAST })}
                >
                  At least
                </button>
                <button
                  type="button"
                  aria-pressed={form.targetType === NumericalHabitType.AT_MOST}
                  onClick={() => update({ targetType: NumericalHabitType.AT_MOST })}
                >
                  At most
                </button>
              </div>
            </div>
          </>
        ) : null}

        <div className="field">
          <span>Frequency</span>
          <div className="segmented schedule-grid">
            {[
              ['daily', 'Daily'],
              ['weekly', 'Weekly'],
              ['monthly', 'Monthly'],
              ['every', 'Every N days'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={form.schedule === id}
                onClick={() => update({ schedule: id })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {form.schedule === 'weekly' || form.schedule === 'monthly' ? (
          <label className="field">
            <span>
              {form.schedule === 'weekly' ? 'Times per week' : 'Times per month'}
            </span>
            <input
              type="number"
              min="1"
              max={form.schedule === 'weekly' ? 6 : 15}
              value={form.times}
              onChange={(event) => update({ times: event.target.value })}
            />
          </label>
        ) : null}

        {form.schedule === 'every' ? (
          <label className="field">
            <span>Repeat every N days</span>
            <input
              type="number"
              min="2"
              max="365"
              value={form.interval}
              onChange={(event) => update({ interval: event.target.value })}
            />
          </label>
        ) : null}

        <label className="field">
          <span>Notes</span>
          <textarea
            rows="2"
            value={form.description}
            onChange={(event) => update({ description: event.target.value })}
          />
        </label>
      </form>
    </Modal>
  )
}
