import { useEffect, useState } from 'react';
import { getInsuranceTypes, register, validationMessages } from '../api.js';

export default function RegisterPage({ onRegistered, onGoToLogin }) {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [insuranceTypes, setInsuranceTypes] = useState([]);
  const [specializationIds, setSpecializationIds] = useState([]);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getInsuranceTypes()
      .then(setInsuranceTypes)
      .catch((error) => setErrors([error.message]));
  }, []);

  const toggleSpecialization = (id) =>
    setSpecializationIds((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

  const submit = async (event) => {
    event.preventDefault();
    if (specializationIds.length === 0) {
      setErrors(['יש לבחור לפחות תחום התמחות אחד']);
      return;
    }

    setBusy(true);
    setErrors([]);
    try {
      await register({ fullName: fullName.trim(), username: username.trim(), password, specializationIds });
      onRegistered();
    } catch (error) {
      const details = validationMessages(error);
      setErrors(details.length ? details : [error.message]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="card narrow">
      <h1>הרשמת שמאי</h1>

      <form onSubmit={submit}>
        <label>
          שם מלא
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} />
        </label>
        <label>
          שם משתמש (אותיות באנגלית וספרות)
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
            pattern="[a-zA-Z0-9_.\-]+"
          />
        </label>
        <label>
          סיסמה (לפחות 8 תווים)
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
        </label>

        <fieldset>
          <legend>תחומי התמחות</legend>
          {insuranceTypes.map((type) => (
            <label key={type.id} className="inline">
              <input
                type="checkbox"
                checked={specializationIds.includes(type.id)}
                onChange={() => toggleSpecialization(type.id)}
              />
              {type.name}
            </label>
          ))}
        </fieldset>

        {errors.map((message) => (
          <p key={message} className="error">{message}</p>
        ))}

        <button type="submit" disabled={busy}>{busy ? 'נרשם...' : 'הרשמה'}</button>
      </form>

      <p>
        כבר רשום?{' '}
        <button type="button" className="link" onClick={onGoToLogin}>להתחברות</button>
      </p>
    </main>
  );
}
