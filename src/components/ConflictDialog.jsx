import { useEffect, useRef } from 'react';

/**
 * Shown when the server answers 409: another employee took (or changed) the claim first.
 * Closing it reloads the list so the user sees the current state.
 */
export default function ConflictDialog({ message, onClose }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    buttonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="overlay" role="presentation">
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="conflict-title" aria-describedby="conflict-message">
        <h2 id="conflict-title">התנגשות (409)</h2>
        <p id="conflict-message" className="conflict-message">{message}</p>
        <p>הרשימה תתרענן כדי להציג את המצב העדכני.</p>
        <button ref={buttonRef} type="button" onClick={onClose}>הבנתי, רענן רשימה</button>
      </div>
    </div>
  );
}
