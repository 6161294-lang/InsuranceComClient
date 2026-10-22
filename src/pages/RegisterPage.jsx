import { useEffect, useState } from 'react';
import * as api from '../api.js';
import { Button, CheckGroup, ErrorAlert, Field } from '../components/ui.jsx';
import { AuthAside } from './LoginPage.jsx';

export default function RegisterPage({ onRegistered, onGoToLogin }) {
  const [types, setTypes] = useState([]);
  const [typesError, setTypesError] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phone: '', address: '', nationalId: '' });
  const [insuranceTypeIds, setInsuranceTypeIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getInsuranceTypes().then(setTypes).catch(setTypesError);
  }, []);

  const set = (name) => (event) => setForm((current) => ({ ...current, [name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (insuranceTypeIds.length === 0) {
      setError('יש לבחור לפחות סוג ביטוח אחד שאתם מחזיקים בו.');
      return;
    }
    setBusy(true);
    try {
      await api.registerClient({ ...form, email: form.email.trim(), insuranceTypeIds });
      onRegistered();
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
            <h1>הרשמה כלקוח</h1>
            <p className="muted">כמה פרטים ואתם בפנים. עובדים (שמאים ומנהלים) נוצרים על ידי מנהל המערכת.</p>
          </div>

          <ErrorAlert error={error} />
          <ErrorAlert error={typesError} />

          <form className="stack" onSubmit={submit}>
            <Field label="שם מלא" htmlFor="reg-name">
              <input id="reg-name" className="input" value={form.fullName} onChange={set('fullName')} minLength={2} maxLength={100} required autoComplete="name" />
            </Field>
            <div className="form-grid">
              <Field label="אימייל" htmlFor="reg-email">
                <input id="reg-email" className="input" type="email" dir="ltr" value={form.email} onChange={set('email')} required autoComplete="email" />
              </Field>
              <Field label="סיסמה" htmlFor="reg-password" hint="לפחות 8 תווים.">
                <input id="reg-password" className="input" type="password" dir="ltr" value={form.password} onChange={set('password')} minLength={8} maxLength={100} required autoComplete="new-password" />
              </Field>
              <Field label="טלפון" htmlFor="reg-phone">
                <input id="reg-phone" className="input" type="tel" dir="ltr" value={form.phone} onChange={set('phone')} pattern="[0-9+\-\s]{7,20}" title="מספר טלפון תקין" required autoComplete="tel" />
              </Field>
              <Field label="מספר זיהוי" htmlFor="reg-id" hint="5 עד 9 ספרות.">
                <input id="reg-id" className="input" inputMode="numeric" dir="ltr" value={form.nationalId} onChange={set('nationalId')} pattern="[0-9]{5,9}" title="5 עד 9 ספרות" required />
              </Field>
              <div className="full">
                <Field label="כתובת" htmlFor="reg-address">
                  <input id="reg-address" className="input" value={form.address} onChange={set('address')} minLength={2} maxLength={200} required autoComplete="street-address" />
                </Field>
              </div>
            </div>

            <CheckGroup label="הביטוחים שאני מחזיק/ה" options={types} selected={insuranceTypeIds} onChange={setInsuranceTypeIds} />

            <Button type="submit" busy={busy} block>
              יצירת חשבון
            </Button>
          </form>

          <div className="row between">
            <span className="muted">כבר רשומים?</span>
            <Button variant="secondary" size="sm" onClick={onGoToLogin}>
              להתחברות
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
