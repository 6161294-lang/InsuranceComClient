import { useState } from 'react';
import { Button, ErrorAlert, Field } from './ui.jsx';

/**
 * Create / edit form of a claim. `onSubmit(values, asDraft)` returns a promise;
 * the form shows the server's error and keeps the entered values when it fails.
 */
export default function ClaimForm({ insuranceTypes, initial, submitLabel, draftLabel, onSubmit, onCancel }) {
  const [insuranceTypeId, setInsuranceTypeId] = useState(String(initial?.insuranceTypeId ?? insuranceTypes[0]?.id ?? ''));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState(null);

  const submit = async (asDraft) => {
    setError(null);
    setBusy(asDraft ? 'draft' : 'submit');
    try {
      await onSubmit({ insuranceTypeId: Number(insuranceTypeId), description: description.trim(), amount: Number(amount) }, asDraft);
    } catch (err) {
      setError(err);
    } finally {
      setBusy('');
    }
  };

  const handle = (event) => {
    event.preventDefault();
    if (event.currentTarget.reportValidity()) submit(false);
  };

  return (
    <form className="stack" onSubmit={handle}>
      <ErrorAlert error={error} />

      <div className="form-grid">
        <Field label="סוג ביטוח" htmlFor="claim-type">
          <select
            id="claim-type"
            className="select"
            value={insuranceTypeId}
            onChange={(event) => setInsuranceTypeId(event.target.value)}
            required
          >
            {insuranceTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="סכום התביעה (₪)" htmlFor="claim-amount">
          <input
            id="claim-amount"
            className="input"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </Field>

        <div className="full">
          <Field label="תיאור האירוע" htmlFor="claim-description" hint="תארו מה קרה, מתי ואיפה (לפחות 3 תווים).">
            <textarea
              id="claim-description"
              className="textarea"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              minLength={3}
              maxLength={2000}
              required
            />
          </Field>
        </div>
      </div>

      <div className="row">
        <Button type="submit" busy={busy === 'submit'} disabled={!!busy}>
          {submitLabel}
        </Button>
        {draftLabel && (
          <Button type="button" variant="secondary" busy={busy === 'draft'} disabled={!!busy} onClick={(event) => event.currentTarget.form.reportValidity() && submit(true)}>
            {draftLabel}
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            ביטול
          </Button>
        )}
      </div>
    </form>
  );
}
