import { useState } from 'react';
import * as api from '../api.js';
import { BoltIcon, LockIcon, ShieldIcon, UsersIcon } from '../components/icons.jsx';
import { Button, ErrorAlert, Field } from '../components/ui.jsx';

// Demo users created by the database seed (see the server README).
const DEMO_USERS = [
  { label: 'מנהל', email: 'manager@example.com', password: 'Manager123!' },
  { label: 'שמאי 1', email: 'appraiser1@example.com', password: 'Appraiser123!' },
  { label: 'שמאי 2', email: 'appraiser2@example.com', password: 'Appraiser123!' },
  { label: 'לקוח 1', email: 'client1@example.com', password: 'Client123!' },
  { label: 'לקוח 2', email: 'client2@example.com', password: 'Client123!' },
];

export function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="brand" style={{ fontSize: '1.3rem' }}>
        <span className="brand-mark" style={{ background: 'rgba(255,255,255,0.18)' }}>
          <ShieldIcon size={22} />
        </span>
        ביטוח-קום
      </div>
      <div className="stack">
        <h1>תביעות ביטוח, בלי הסחבת</h1>
        <p>פותחים תביעה, שמאי מתאים לוקח אותה לטיפול, ואתם רואים כל שלב בזמן אמת.</p>
      </div>
      <ul className="feature-list">
        <li>
          <BoltIcon />
          פתיחת תביעה בדקות, כולל שמירה כטיוטה
        </li>
        <li>
          <UsersIcon />
          שמאי לפי תחום התמחות, ללא כפילויות בטיפול
        </li>
        <li>
          <LockIcon />
          הרשאות נפרדות ללקוח, לשמאי ולמנהל
        </li>
      </ul>
    </aside>
  );
}

export default function LoginPage({ notice, onLoggedIn, onGoToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      onLoggedIn(await api.login(email.trim(), password));
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <AuthAside />
      <main className="auth-main">
        <div className="auth-card">
          <div className="stack">
            <h1>התחברות</h1>
            <p className="muted">ברוכים הבאים. היכנסו עם האימייל והסיסמה שלכם.</p>
          </div>

          {notice && <div className="alert alert-info" role="status">{notice}</div>}
          <ErrorAlert error={error} />

          <form className="stack" onSubmit={submit}>
            <Field label="אימייל" htmlFor="login-email">
              <input
                id="login-email"
                className="input"
                type="email"
                autoComplete="username"
                dir="ltr"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </Field>
            <Field label="סיסמה" htmlFor="login-password">
              <input
                id="login-password"
                className="input"
                type="password"
                autoComplete="current-password"
                dir="ltr"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>
            <Button type="submit" busy={busy} block>
              התחברות
            </Button>
          </form>

          <div className="row between">
            <span className="muted">עדיין אין לכם חשבון?</span>
            <Button variant="secondary" size="sm" onClick={onGoToRegister}>
              הרשמה כלקוח
            </Button>
          </div>

          <div className="demo-box">
            <strong className="small">משתמשי דמו — לחיצה ממלאת את הטופס</strong>
            <div className="filters">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  className="filter"
                  onClick={() => {
                    setEmail(user.email);
                    setPassword(user.password);
                  }}
                >
                  {user.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
