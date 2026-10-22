import { useState } from 'react';
import * as api from '../api.js';
import ClaimForm from '../components/ClaimForm.jsx';
import ClaimsBoard from '../components/ClaimsBoard.jsx';
import { useLoader, useTab } from '../components/hooks.js';
import { Button, ConfirmDialog, EmptyState, ErrorAlert, Field, Modal, Skeletons, useToast } from '../components/ui.jsx';

const TABS = [
  { id: 'claims', label: 'התביעות שלי' },
  { id: 'new', label: 'תביעה חדשה' },
  { id: 'details', label: 'הפרטים שלי' },
];

const ALL_STATUSES = ['Draft', 'Opened', 'InTreatment', 'Approved', 'Rejected', 'Cancelled'];

export default function ClientPage({ user }) {
  const [tab, setTab] = useTab(TABS, 'claims');
  const { data: client, error, reload } = useLoader(() => api.getClient(user.id), [user.id]);

  return (
    <div className="page">
      <div className="page-head">
        <h1>שלום, {user.fullName}</h1>
        <p className="muted">כאן אפשר לפתוח תביעה, לעקוב אחריה ולעדכן את הפרטים שלכם.</p>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((item) => (
          <button key={item.id} role="tab" className="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <ErrorAlert error={error} />

      {tab === 'claims' && <MyClaims types={client?.insuranceTypes ?? []} onNew={() => setTab('new')} />}
      {tab === 'new' && <NewClaim client={client} onCreated={() => setTab('claims')} />}
      {tab === 'details' && <MyDetails client={client} onSaved={reload} />}
    </div>
  );
}

function MyClaims({ types, onNew }) {
  const toast = useToast();
  const [editing, setEditing] = useState(null); // { claim, reload }
  const [confirm, setConfirm] = useState(null); // { kind, claim, reload }

  const run = async (action, successMessage, reload) => {
    try {
      await action();
      toast.success(successMessage);
      reload();
    } catch (error) {
      toast.error(error.message);
      reload(); // a 409 or 400 usually means the claim changed - show its current state
    } finally {
      setConfirm(null);
    }
  };

  const renderActions = (claim, reload) => {
    if (claim.status === 'Draft') {
      return (
        <>
          <Button size="sm" onClick={() => run(() => api.setClaimStatus(claim.id, 'Opened', claim.version), 'התביעה הוגשה', reload)}>
            הגשת התביעה
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setEditing({ claim, reload })}>
            עריכה
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: 'delete', claim, reload })}>
            מחיקה
          </Button>
        </>
      );
    }
    if (claim.status === 'Opened' || claim.status === 'InTreatment') {
      return (
        <Button size="sm" variant="secondary" onClick={() => setConfirm({ kind: 'cancel', claim, reload })}>
          ביטול תביעה
        </Button>
      );
    }
    return <span className="muted small">אין פעולות זמינות</span>;
  };

  return (
    <>
      <ClaimsBoard
        load={(query) => api.getClaims(query)}
        statuses={ALL_STATUSES}
        renderActions={renderActions}
        emptyTitle="עדיין אין תביעות"
        emptyText="כשתפתחו תביעה היא תופיע כאן."
        header={
          <div className="row between">
            <h2>התביעות שלי</h2>
            <Button size="sm" variant="secondary" onClick={onNew}>
              + תביעה חדשה
            </Button>
          </div>
        }
      />

      {editing && (
        <Modal title={`עריכת טיוטה ${editing.claim.claimNumber}`} onClose={() => setEditing(null)}>
          <ClaimForm
            insuranceTypes={types}
            initial={editing.claim}
            submitLabel="שמירת שינויים"
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await api.updateClaim(editing.claim.id, { ...values, version: editing.claim.version });
              toast.success('הטיוטה עודכנה');
              editing.reload();
              setEditing(null);
            }}
          />
        </Modal>
      )}

      {confirm?.kind === 'cancel' && (
        <ConfirmDialog
          title="ביטול תביעה"
          text={`לבטל את התביעה ${confirm.claim.claimNumber}? לא ניתן לחדש תביעה שבוטלה.`}
          confirmLabel="כן, לבטל את התביעה"
          danger
          onClose={() => setConfirm(null)}
          onConfirm={() => run(() => api.setClaimStatus(confirm.claim.id, 'Cancelled', confirm.claim.version), 'התביעה בוטלה', confirm.reload)}
        />
      )}

      {confirm?.kind === 'delete' && (
        <ConfirmDialog
          title="מחיקת טיוטה"
          text={`למחוק לצמיתות את הטיוטה ${confirm.claim.claimNumber}?`}
          confirmLabel="כן, למחוק"
          danger
          onClose={() => setConfirm(null)}
          onConfirm={() => run(() => api.deleteClaim(confirm.claim.id), 'הטיוטה נמחקה', confirm.reload)}
        />
      )}
    </>
  );
}

function NewClaim({ client, onCreated }) {
  const toast = useToast();

  if (!client) return <Skeletons count={1} />;

  if (client.insuranceTypes.length === 0) {
    return (
      <EmptyState
        title="אין לכם ביטוח פעיל"
        text="תביעה אפשר לפתוח רק על סוג ביטוח שאתם מחזיקים בו. פנו למנהל המערכת כדי לעדכן את הביטוחים שלכם."
      />
    );
  }

  return (
    <div className="card" style={{ maxWidth: 720 }}>
      <div className="card-title">
        <h2>פתיחת תביעה חדשה</h2>
      </div>
      <ClaimForm
        insuranceTypes={client.insuranceTypes}
        submitLabel="הגשת התביעה"
        draftLabel="שמירה כטיוטה"
        onSubmit={async (values, asDraft) => {
          await api.createClaim({ ...values, saveAsDraft: asDraft });
          toast.success(asDraft ? 'הטיוטה נשמרה' : 'התביעה הוגשה בהצלחה');
          onCreated();
        }}
      />
    </div>
  );
}

function MyDetails({ client, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!client) return <Skeletons count={1} />;

  const values = form ?? { fullName: client.fullName, phone: client.phone, address: client.address };
  const set = (name) => (event) => setForm({ ...values, [name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.updateClient(client.id, values);
      toast.success('הפרטים נשמרו');
      setForm(null);
      onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card stack" style={{ maxWidth: 720 }} onSubmit={submit}>
      <div className="card-title">
        <h2>הפרטים שלי</h2>
      </div>
      <ErrorAlert error={error} />
      <div className="form-grid">
        <Field label="שם מלא" htmlFor="me-name">
          <input id="me-name" className="input" value={values.fullName} onChange={set('fullName')} minLength={2} maxLength={100} required />
        </Field>
        <Field label="טלפון" htmlFor="me-phone">
          <input id="me-phone" className="input" type="tel" dir="ltr" value={values.phone} onChange={set('phone')} pattern="[0-9+\-\s]{7,20}" required />
        </Field>
        <div className="full">
          <Field label="כתובת" htmlFor="me-address">
            <input id="me-address" className="input" value={values.address} onChange={set('address')} minLength={2} maxLength={200} required />
          </Field>
        </div>
        <Field label="אימייל" htmlFor="me-email" hint="האימייל משמש להתחברות ואינו ניתן לשינוי.">
          <input id="me-email" className="input" dir="ltr" value={client.email} readOnly />
        </Field>
        <Field label="מספר זיהוי" htmlFor="me-id">
          <input id="me-id" className="input" dir="ltr" value={client.nationalId ?? ''} readOnly />
        </Field>
      </div>

      <div className="field">
        <span className="label">הביטוחים שלי</span>
        <div className="chip-list">
          {client.insuranceTypes.length === 0 && <span className="muted">אין ביטוחים פעילים</span>}
          {client.insuranceTypes.map((type) => (
            <span key={type.id} className="chip">
              {type.name}
            </span>
          ))}
        </div>
      </div>

      <div className="row">
        <Button type="submit" busy={busy}>
          שמירת שינויים
        </Button>
      </div>
    </form>
  );
}
