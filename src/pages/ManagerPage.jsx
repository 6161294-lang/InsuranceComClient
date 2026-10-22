import { useState } from 'react';
import * as api from '../api.js';
import ClaimsBoard from '../components/ClaimsBoard.jsx';
import { ROLE_LABELS } from '../components/format.js';
import { useLoader, useTab } from '../components/hooks.js';
import {
  Button,
  CheckGroup,
  ConfirmDialog,
  EmptyState,
  ErrorAlert,
  Field,
  Modal,
  Pagination,
  Skeletons,
  useToast,
} from '../components/ui.jsx';

const TABS = [
  { id: 'claims', label: 'כל התביעות' },
  { id: 'clients', label: 'לקוחות' },
  { id: 'types', label: 'סוגי ביטוח' },
  { id: 'employees', label: 'עובדים' },
];

export default function ManagerPage({ user }) {
  const [tab, setTab] = useTab(TABS, 'claims');

  return (
    <div className="page">
      <div className="page-head">
        <h1>שלום, {user.fullName}</h1>
        <p className="muted">מבט כולל על התביעות, הלקוחות, סוגי הביטוח והעובדים.</p>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map((item) => (
          <button key={item.id} role="tab" className="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'claims' && <AllClaims />}
      {tab === 'clients' && <Clients />}
      {tab === 'types' && <InsuranceTypes />}
      {tab === 'employees' && <Employees currentUserId={user.id} />}
    </div>
  );
}

function AllClaims() {
  return (
    <ClaimsBoard
      load={(query) => api.getClaims(query)}
      statuses={['Opened', 'InTreatment', 'Approved', 'Rejected', 'Cancelled']}
      showClient
      header={
        <div>
          <h2>כל התביעות</h2>
          <p className="muted small">טיוטות של לקוחות פרטיות ואינן מוצגות. פתיחה ומחיקה של תביעות הן פעולות של הלקוח בלבד.</p>
        </div>
      }
      emptyTitle="אין תביעות במערכת"
    />
  );
}

// ---------- clients ----------
function Clients() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const { loading, error, data, reload } = useLoader(() => api.getClients({ page, pageSize: 10 }), [page]);

  return (
    <div className="stack">
      <h2>לקוחות</h2>
      <ErrorAlert error={error} />
      {loading && !data ? (
        <Skeletons count={1} />
      ) : data && data.items.length === 0 ? (
        <EmptyState title="אין לקוחות רשומים" />
      ) : (
        data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>שם</th>
                  <th>אימייל</th>
                  <th>טלפון</th>
                  <th>כתובת</th>
                  <th>מספר זיהוי</th>
                  <th>ביטוחים</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <strong>{client.fullName}</strong>
                    </td>
                    <td dir="ltr" style={{ textAlign: 'start' }}>{client.email}</td>
                    <td dir="ltr" style={{ textAlign: 'start' }}>{client.phone}</td>
                    <td>{client.address}</td>
                    <td dir="ltr" style={{ textAlign: 'start' }}>{client.nationalId}</td>
                    <td>
                      <div className="chip-list">
                        {client.insuranceTypes.length === 0 && <span className="muted">—</span>}
                        {client.insuranceTypes.map((type) => (
                          <span key={type.id} className="chip">{type.name}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <Button size="sm" variant="secondary" onClick={() => setEditing(client)}>
                        עריכת ביטוחים
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}

      {editing && (
        <ClientInsuranceModal
          client={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function ClientInsuranceModal({ client, onClose, onSaved }) {
  const toast = useToast();
  const { data: types } = useLoader(() => api.getInsuranceTypes(), []);
  const [selected, setSelected] = useState(client.insuranceTypes.map((type) => type.id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.updateClientInsuranceTypes(client.id, selected);
      toast.success('הביטוחים של הלקוח עודכנו');
      onSaved();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <Modal title={`ביטוחים של ${client.fullName}`} onClose={onClose}>
      <p className="muted small">הלקוח יכול לפתוח תביעה רק על סוגי הביטוח המסומנים.</p>
      <ErrorAlert error={error} />
      {types ? <CheckGroup label="סוגי ביטוח" options={types} selected={selected} onChange={setSelected} /> : <Skeletons count={1} />}
      <div className="modal-actions">
        <Button busy={busy} onClick={save}>שמירה</Button>
        <Button variant="secondary" onClick={onClose}>ביטול</Button>
      </div>
    </Modal>
  );
}

// ---------- insurance types ----------
function InsuranceTypes() {
  const toast = useToast();
  const { loading, error, data, reload } = useLoader(() => api.getInsuranceTypes(), []);
  const [editing, setEditing] = useState(null); // {} for a new type
  const [deleting, setDeleting] = useState(null);

  return (
    <div className="stack">
      <div className="row between">
        <h2>סוגי ביטוח</h2>
        <Button size="sm" onClick={() => setEditing({})}>+ סוג ביטוח חדש</Button>
      </div>
      <ErrorAlert error={error} />
      {loading && !data ? (
        <Skeletons count={1} />
      ) : data && data.length === 0 ? (
        <EmptyState title="אין סוגי ביטוח" text="הוסיפו סוג ביטוח כדי שלקוחות ושמאים יוכלו להשתמש בו." />
      ) : (
        data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>שם</th>
                  <th>תיאור</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.map((type) => (
                  <tr key={type.id}>
                    <td><strong>{type.name}</strong></td>
                    <td className="muted">{type.description || '—'}</td>
                    <td>
                      <div className="actions">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(type)}>עריכה</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(type)}>מחיקה</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {editing && (
        <InsuranceTypeModal
          type={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="מחיקת סוג ביטוח"
          text={`למחוק את סוג הביטוח "${deleting.name}"? ניתן למחוק רק סוג ביטוח שאין אליו תביעות, לקוחות או שמאים.`}
          confirmLabel="כן, למחוק"
          danger
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await api.deleteInsuranceType(deleting.id);
              toast.success('סוג הביטוח נמחק');
              reload();
            } catch (err) {
              toast.error(err.message);
            } finally {
              setDeleting(null);
            }
          }}
        />
      )}
    </div>
  );
}

function InsuranceTypeModal({ type, onClose, onSaved }) {
  const toast = useToast();
  const isNew = type.id === undefined;
  const [name, setName] = useState(type.name ?? '');
  const [description, setDescription] = useState(type.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const body = { name: name.trim(), description: description.trim() || null };
    try {
      if (isNew) await api.createInsuranceType(body);
      else await api.updateInsuranceType(type.id, body);
      toast.success(isNew ? 'סוג הביטוח נוסף' : 'סוג הביטוח עודכן');
      onSaved();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <Modal title={isNew ? 'סוג ביטוח חדש' : 'עריכת סוג ביטוח'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <ErrorAlert error={error} />
        <Field label="שם" htmlFor="type-name">
          <input id="type-name" className="input" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required />
        </Field>
        <Field label="תיאור" htmlFor="type-description">
          <textarea id="type-description" className="textarea" style={{ minHeight: 80 }} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </Field>
        <div className="modal-actions">
          <Button type="submit" busy={busy}>שמירה</Button>
          <Button type="button" variant="secondary" onClick={onClose}>ביטול</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- employees ----------
function Employees({ currentUserId }) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const { loading, error, data, reload } = useLoader(() => api.getEmployees({ page, pageSize: 10 }), [page]);

  return (
    <div className="stack">
      <div className="row between">
        <h2>עובדים</h2>
        <Button size="sm" onClick={() => setCreating(true)}>+ עובד חדש</Button>
      </div>
      <ErrorAlert error={error} />
      {loading && !data ? (
        <Skeletons count={1} />
      ) : (
        data && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>שם</th>
                  <th>אימייל</th>
                  <th>תפקיד</th>
                  <th>התמחויות</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((employee) => (
                  <tr key={employee.id}>
                    <td><strong>{employee.fullName}</strong></td>
                    <td dir="ltr" style={{ textAlign: 'start' }}>{employee.email}</td>
                    <td>
                      <span className={`badge ${employee.role === 'Manager' ? 'badge-primary' : 'badge-info'}`}>
                        {ROLE_LABELS[employee.role]}
                      </span>
                    </td>
                    <td>
                      <div className="chip-list">
                        {employee.specializations.length === 0 && <span className="muted">—</span>}
                        {employee.specializations.map((type) => (
                          <span key={type.id} className="chip">{type.name}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {employee.id === currentUserId ? (
                        <span className="muted small">המשתמש שלך</span>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(employee)}>מחיקה</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
      {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}

      {creating && (
        <EmployeeModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            reload();
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="מחיקת עובד"
          text={`למחוק את ${deleting.fullName}? ניתן למחוק רק עובד שלא טיפל בתביעות ולא קיבל הפניות.`}
          confirmLabel="כן, למחוק"
          danger
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            try {
              await api.deleteEmployee(deleting.id);
              toast.success('העובד נמחק');
              reload();
            } catch (err) {
              toast.error(err.message);
            } finally {
              setDeleting(null);
            }
          }}
        />
      )}
    </div>
  );
}

function EmployeeModal({ onClose, onSaved }) {
  const toast = useToast();
  const { data: types } = useLoader(() => api.getInsuranceTypes(), []);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'Appraiser' });
  const [specializationIds, setSpecializationIds] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (name) => (event) => setForm({ ...form, [name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (form.role === 'Appraiser' && specializationIds.length === 0) {
      setError('יש לבחור לפחות תחום התמחות אחד לשמאי.');
      return;
    }
    setBusy(true);
    try {
      await api.createEmployee({
        ...form,
        email: form.email.trim(),
        specializationIds: form.role === 'Appraiser' ? specializationIds : [],
      });
      toast.success('העובד נוצר');
      onSaved();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  };

  return (
    <Modal title="עובד חדש" onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <ErrorAlert error={error} />
        <div className="form-grid">
          <Field label="שם מלא" htmlFor="emp-name">
            <input id="emp-name" className="input" value={form.fullName} onChange={set('fullName')} minLength={2} maxLength={100} required />
          </Field>
          <Field label="תפקיד" htmlFor="emp-role">
            <select id="emp-role" className="select" value={form.role} onChange={set('role')}>
              <option value="Appraiser">שמאי</option>
              <option value="Manager">מנהל</option>
            </select>
          </Field>
          <Field label="אימייל" htmlFor="emp-email">
            <input id="emp-email" className="input" type="email" dir="ltr" value={form.email} onChange={set('email')} required />
          </Field>
          <Field label="סיסמה" htmlFor="emp-password" hint="לפחות 8 תווים.">
            <input id="emp-password" className="input" type="password" dir="ltr" value={form.password} onChange={set('password')} minLength={8} maxLength={100} required autoComplete="new-password" />
          </Field>
        </div>
        {form.role === 'Appraiser' && (
          types
            ? <CheckGroup label="תחומי התמחות" options={types} selected={specializationIds} onChange={setSpecializationIds} />
            : <Skeletons count={1} />
        )}
        <div className="modal-actions">
          <Button type="submit" busy={busy}>יצירת עובד</Button>
          <Button type="button" variant="secondary" onClick={onClose}>ביטול</Button>
        </div>
      </form>
    </Modal>
  );
}
