import { useState } from 'react';
import { login, validationMessages } from '../api.js';

export default function LoginPage({ notice, onLoggedIn, onGoToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setErrors([]);
    try {
      onLoggedIn(await login(username.trim(), password));
    } catch (error) {
      const details = validationMessages(error);
      setErrors(details.length ? details : [error.message]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="card narrow">
      <h1>התחברות</h1>
      {notice && <p className="success">{notice}</p>}

      <form onSubmit={submit}>
        <label>
          שם משתמש
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          סיסמה
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {errors.map((message) => (
          <p key={message} className="error">{message}</p>
        ))}

        <button type="submit" disabled={busy}>{busy ? 'מתחבר...' : 'התחבר'}</button>
      </form>

      <p>
        אין לך משתמש?{' '}
        <button type="button" className="link" onClick={onGoToRegister}>להרשמה</button>
      </p>

      <details className="hint">
        <summary>משתמשי דמו</summary>
        <ul>
          <li>מנהל: manager / Manager123!</li>
          <li>שמאי: adjuster1 / Adjuster123!</li>
          <li>שמאי: adjuster2 / Adjuster123!</li>
        </ul>
      </details>
    </main>
  );
}
