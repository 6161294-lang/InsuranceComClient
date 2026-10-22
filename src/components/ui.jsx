import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { validationMessages } from '../api.js';
import { STATUS } from './format.js';
import { AlertIcon, CheckIcon, CloseIcon, InboxIcon } from './icons.jsx';

// ---------- toasts ----------
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const push = useCallback((tone, message) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, tone, message }]);
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4500);
  }, []);

  const api = useRef({
    success: (message) => push('success', message),
    error: (message) => push('error', message),
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>
            {toast.tone === 'success' ? <CheckIcon /> : <AlertIcon />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---------- small pieces ----------
export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function Button({ busy, children, variant = 'primary', size, block, ...props }) {
  const classes = ['btn', `btn-${variant}`, size === 'sm' && 'btn-sm', block && 'btn-block'].filter(Boolean).join(' ');
  return (
    <button className={classes} disabled={busy || props.disabled} {...props}>
      {busy && <Spinner />}
      {children}
    </button>
  );
}

export function StatusBadge({ status }) {
  const info = STATUS[status] ?? { label: status, tone: 'neutral' };
  return <span className={`badge badge-${info.tone}`}>{info.label}</span>;
}

export function ErrorAlert({ error }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : error.message;
  const details = typeof error === 'string' ? [] : validationMessages(error);
  return (
    <div className="alert alert-error" role="alert">
      <AlertIcon size={18} />
      <div>
        {message}
        {details.length > 0 && (
          <ul>
            {details.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      <InboxIcon size={40} />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function Skeletons({ count = 3 }) {
  return (
    <div className="grid" aria-busy="true" aria-label="טוען">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="skeleton" />
      ))}
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <nav className="pager" aria-label="עימוד">
      <Button variant="secondary" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        הקודם
      </Button>
      <span className="muted small">
        עמוד {page} מתוך {totalPages}
      </span>
      <Button variant="secondary" size="sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        הבא
      </Button>
    </nav>
  );
}

export function Field({ label, hint, children, htmlFor }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/** A group of pill checkboxes, used for choosing insurance types. */
export function CheckGroup({ options, selected, onChange, label }) {
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  return (
    <div className="field" role="group" aria-label={label}>
      <span className="label">{label}</span>
      <div className="checks">
        {options.map((option) => (
          <label key={option.id} className="check">
            <input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggle(option.id)} />
            {option.name}
          </label>
        ))}
      </div>
    </div>
  );
}

// ---------- dialogs ----------
export function Modal({ title, onClose, children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const previous = document.activeElement;
    ref.current?.querySelector('input, select, textarea, button.btn')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="סגירה">
            <CloseIcon size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, text, confirmLabel, danger, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={title} onClose={onClose}>
      <p>{text}</p>
      <div className="modal-actions">
        <Button variant={danger ? 'danger' : 'primary'} busy={busy} onClick={confirm}>
          {confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          חזרה
        </Button>
      </div>
    </Modal>
  );
}

/**
 * Shown when the server answers 409 because another appraiser took the claim first.
 * This is the most important message of the demo, so it is deliberately hard to miss.
 */
export function ConflictDialog({ message, onClose }) {
  return (
    <Modal title="התביעה כבר נלקחה" onClose={onClose} className="conflict">
      <div className="conflict-icon">
        <AlertIcon size={34} />
      </div>
      <h2>{message}</h2>
      <p className="muted">
        שמאי אחר לחץ על "קח לטיפול" רגע לפניך, ולכן התביעה כבר איננה זמינה. הרשימה רועננה, ואפשר לבחור תביעה אחרת.
      </p>
      <div className="modal-actions">
        <Button onClick={onClose}>הבנתי</Button>
      </div>
    </Modal>
  );
}
