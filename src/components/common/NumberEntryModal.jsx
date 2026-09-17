import { useState } from 'react'
import { Modal } from './Modal.jsx'
import { SKIP, UNKNOWN, fromMillivalue, millivalue } from '../../models/Entry.js'
import './Modal.css'

function initialNumberInput(value) {
  if (value === UNKNOWN || value === SKIP || value == null) return ''
  return String(fromMillivalue(value))
}

export function NumberEntryModal({ open, habit, dateLabel, value, onClose, onSave }) {
  if (!open) return null
  return (
    <NumberEntryFields
      key={`${habit?.id ?? 'habit'}-${dateLabel}`}
      habit={habit}
      dateLabel={dateLabel}
      value={value}
      onClose={onClose}
      onSave={onSave}
    />
  )
}

function NumberEntryFields({ habit, dateLabel, value, onClose, onSave }) {
  const [input, setInput] = useState(() => initialNumberInput(value))

  function submit(event) {
    event.preventDefault()
    if (input === '') {
      onSave(UNKNOWN)
      return
    }
    onSave(millivalue(Number(input)))
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={habit?.name ?? 'Enter value'}
      footer={
        <>
          <button type="button" className="btn btn-danger" onClick={() => onSave(SKIP)}>
            Skip
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => onSave(UNKNOWN)}>
            Clear
          </button>
          <button type="submit" form="number-entry-form" className="btn btn-primary">
            Save
          </button>
        </>
      }
    >
      <form id="number-entry-form" onSubmit={submit}>
        <p className="field-label">{dateLabel}</p>
        {habit?.question ? <p className="number-question">{habit.question}</p> : null}
        <label className="field">
          <span>
            Value{habit?.unit ? ` (${habit.unit})` : ''}
            {habit ? ` · target ${habit.targetValue}` : ''}
          </span>
          <input
            autoFocus
            type="number"
            step="any"
            inputMode="decimal"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="0"
          />
        </label>
      </form>
    </Modal>
  )
}
