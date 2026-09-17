import { Modal } from './Modal.jsx'
import './ConfirmDialog.css'
import './Modal.css'

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {string} [props.message]
 * @param {{ label: string, variant?: 'primary' | 'ghost' | 'danger', onClick: () => void }[]} props.actions
 * @param {() => void} props.onClose
 */
export function ConfirmDialog({ open, title, message, actions, onClose }) {
  if (!open) return null

  return (
    <Modal
      open
      className="confirm-overlay"
      title={title}
      onClose={onClose}
      footer={
        <>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`btn btn-${action.variant ?? 'ghost'}`}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          ))}
        </>
      }
    >
      {message ? <p className="confirm-message">{message}</p> : null}
    </Modal>
  )
}
